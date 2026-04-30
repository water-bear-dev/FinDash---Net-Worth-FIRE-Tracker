from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from typing import List, Dict, Any
import uvicorn
import time
import threading

app = FastAPI(title="FinDash Price Server")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache
# { "TICKER": {"price": float, "timestamp": float} }
price_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 300  # 5 minutes
cache_lock = threading.Lock()

def get_cached_price(ticker: str) -> float:
    ticker = ticker.upper()
    with cache_lock:
        if ticker in price_cache:
            entry = price_cache[ticker]
            if time.time() - entry['timestamp'] < CACHE_TTL:
                return entry['price']
    return None

def set_cached_price(ticker: str, price: float):
    with cache_lock:
        price_cache[ticker.upper()] = {
            "price": price,
            "timestamp": time.time()
        }

@app.get("/")
def root():
    return {
        "message": "FinDash Price Server is running",
        "endpoints": ["/", "/health", "/prices?tickers=AAPL,MSFT", "/price/{ticker}", "/search?q={query}"]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "cache_size": len(price_cache)}

@app.get("/price/{ticker}")
def get_price(ticker: str):
    """Fetch latest price for a single ticker with caching."""
    ticker = ticker.upper().strip()
    return fetch_single_price(ticker)

@app.get("/price")
def get_price_query(tickers: str = Query(None), ticker: str = Query(None)):
    """Handle /price?tickers=... or /price?ticker=... as aliases."""
    t = tickers or ticker
    if not t:
        raise HTTPException(status_code=400, detail="Missing ticker(s)")
    
    # If multiple tickers, use the batch fetch logic
    if "," in t:
        return get_multiple_prices(t)
    
    # Otherwise fetch single
    return fetch_single_price(t.strip().upper())

def fetch_single_price(ticker: str, error_as_zero: bool = False):
    cached = get_cached_price(ticker)
    if cached:
        return {"symbol": ticker, "price": cached, "source": "cache"}

    try:
        t = yf.Ticker(ticker)
        price = None
        
        # 1. Try fast_info (preferred)
        try:
            price = t.fast_info.last_price
        except:
            pass
            
        # 2. Try history fallback
        if price is None or price <= 0:
            hist = t.history(period="5d")
            if not hist.empty:
                # Get the last non-NaN close price
                price = hist['Close'].dropna().iloc[-1]
        
        if price is None or price <= 0:
            raise ValueError(f"Could not retrieve price for {ticker}")

        price = round(float(price), 2)
        set_cached_price(ticker, price)
        
        return {
            "symbol": ticker,
            "price": price,
            "source": "live"
        }
    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        if error_as_zero:
            return {"symbol": ticker, "price": 0, "source": "error", "detail": str(e)}
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/prices")
def get_multiple_prices(tickers: str = Query(...)):
    """
    Fetch latest prices for multiple tickers using batch processing.
    """
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not ticker_list:
        return []

    results = []
    to_fetch = []

    # Check cache first
    for ticker in ticker_list:
        cached = get_cached_price(ticker)
        if cached:
            results.append({"symbol": ticker, "price": cached, "source": "cache"})
        else:
            to_fetch.append(ticker)

    if to_fetch:
        try:
            # Batch fetch missing tickers with group_by="ticker"
            # Note: threads=False can sometimes be more stable in certain environments
            data = yf.download(to_fetch, period="5d", interval="1d", progress=False, threads=False, group_by="ticker")
            
            if data.empty:
                raise ValueError("Batch download returned no data")

            for ticker in to_fetch:
                try:
                    price = None
                    if len(to_fetch) == 1:
                        # For single ticker with group_by="ticker", it's still a DataFrame but columns are just Open, Close...
                        if 'Close' in data:
                            price = data['Close'].dropna().iloc[-1]
                    else:
                        # For multiple tickers, it's ticker-indexed MultiIndex
                        if ticker in data and 'Close' in data[ticker]:
                            price = data[ticker]['Close'].dropna().iloc[-1]
                    
                    if price is not None and price > 0:
                        price = round(float(price), 2)
                        set_cached_price(ticker, price)
                        results.append({"symbol": ticker, "price": price, "source": "live"})
                    else:
                        raise ValueError("No price in batch")
                except Exception:
                    # Fallback to individual
                    results.append(fetch_single_price(ticker, error_as_zero=True))
        except Exception as e:
            print(f"Batch fetch error: {e}. Falling back to individual.")
            for ticker in to_fetch:
                results.append(fetch_single_price(ticker, error_as_zero=True))

    return results

@app.get("/search")
def search_tickers(q: str = Query(..., min_length=1)):
    """
    Search for tickers using Yahoo Finance search API.
    """
    try:
        search = yf.Search(q, max_results=10)
        results = []
        for quote in search.quotes:
            results.append({
                "symbol": quote.get("symbol"),
                "name": quote.get("longname") or quote.get("shortname"),
                "exchange": quote.get("exchange"),
                "type": quote.get("quoteType")
            })
        return results
    except Exception as e:
        print(f"Search error for '{q}': {e}")
        return []

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
