import yfinance as yf
import json
import math
import pandas as pd

# --- 1. ETF & Ticker Configuration ---
etf_map = {
    "BANKBEES": { "symbol": "BANKBEES.NS", "category": "Banking", "desc": "Benchmark for Indian Banking sector (Private & PSU).", "constituents": ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "AXISBANK.NS", "KOTAKBANK.NS"] },
    "NIFTYBEES": { "symbol": "NIFTYBEES.NS", "category": "Nifty 50", "desc": "Tracks the Nifty 50 Index (Top 50 Blue-chip companies).", "constituents": ["HDFCBANK.NS", "RELIANCE.NS", "ICICIBANK.NS", "INFY.NS", "ITC.NS"] },
    "AUTOBEES": { "symbol": "AUTOBEES.NS", "category": "Auto", "desc": "Exposure to leading Automobile manufacturers.", "constituents": ["M&M.NS", "MARUTI.NS", "BAJAJ-AUTO.NS", "EICHERMOT.NS"] },
    "ITBEES": { "symbol": "ITBEES.NS", "category": "IT Tech", "desc": "Indian IT Services and Software giants.", "constituents": ["INFY.NS", "TCS.NS", "HCLTECH.NS", "TECHM.NS"] },
    "PHARMABEES": { "symbol": "PHARMABEES.NS", "category": "Pharma", "desc": "Pharmaceutical and Healthcare sector leaders.", "constituents": ["SUNPHARMA.NS", "DIVISLAB.NS", "CIPLA.NS", "DRREDDY.NS"] },
    "PSUBANKBEES": { "symbol": "PSUBNKBEES.NS", "category": "PSU Bank", "desc": "Government-owned Public Sector Banks.", "constituents": ["SBIN.NS", "BANKBARODA.NS", "CANBK.NS", "PNB.NS"] },
    "JUNIORBEES": { "symbol": "JUNIORBEES.NS", "category": "Next 50", "desc": "Nifty Next 50 - The future blue-chips.", "constituents": ["HAL.NS", "BEL.NS", "VBL.NS", "TRENT.NS"] },
    "GOLDBEES": { "symbol": "GOLDBEES.NS", "category": "Commodity", "desc": "Physical Gold price tracker.", "constituents": [] },
    "SILVERBEES": { "symbol": "SILVERBEES.NS", "category": "Commodity", "desc": "Physical Silver price tracker.", "constituents": [] },
    "MON100": { "symbol": "MON100.NS", "category": "Global", "desc": "Nasdaq 100 (US Tech) ETF.", "constituents": ["NVDA", "AAPL", "MSFT"] }
}

# Stocks for the Moving Ticker Tape (Fixed LTF)
ticker_tape_symbols = [
    "LTF.NS", "ABCAPITAL.NS", "LICHSGFIN.NS", "M&MFIN.NS", 
    "MUTHOOTFIN.NS", "SBICARD.NS", "TATACONSUM.NS", "JIOFIN.NS"
]

def safe_float(val):
    try:
        if pd.isna(val) or math.isnan(val): return None
        return round(float(val), 2)
    except: return None

def get_cagr(hist):
    try:
        years = (hist.index[-1] - hist.index[0]).days / 365.25
        if years < 1: return 10.0
        start = hist['Close'].iloc[0]
        end = hist['Close'].iloc[-1]
        return round(((end/start)**(1/years) - 1) * 100, 2)
    except: return 12.0

def fetch_ticker_tape_data():
    """Fetches data for the scrolling top bar"""
    print("  Fetching Ticker Tape Data...")
    data = []
    try:
        tickers = yf.download(ticker_tape_symbols, period="2d", group_by='ticker', progress=False)
        for symbol in ticker_tape_symbols:
            try:
                df = tickers[symbol] if len(ticker_tape_symbols) > 1 else tickers
                if df.empty: continue
                current = df['Close'].iloc[-1]
                prev = df['Close'].iloc[-2]
                change = ((current - prev) / prev) * 100

                clean_name = symbol.replace(".NS", "").replace("TATACONSUM", "TATA CAP")
                data.append({
                    "name": clean_name,
                    "price": safe_float(current),
                    "change": safe_float(change)
                })
            except: continue
    except Exception as e:
        print(f"Error ticker tape: {e}")
    return data

def fetch_constituents(ticker_list):
    """Fetches detailed price, EMA & 52W high/low for constituents"""
    if not ticker_list: return []
    details = []
    try:
        data = yf.download(ticker_list, period="1y", group_by='ticker', progress=False)
        for symbol in ticker_list:
            try:
                df = data[symbol] if len(ticker_list) > 1 else data
                if df.empty: continue

                curr = df['Close'].iloc[-1]
                ema100 = df['Close'].ewm(span=100, adjust=False).mean().iloc[-1]
                ema200 = df['Close'].ewm(span=200, adjust=False).mean().iloc[-1]
                high52 = df['High'].max()
                low52 = df['Low'].min()

                details.append({
                    "name": symbol.replace(".NS", ""),
                    "price": safe_float(curr),
                    "ema100": safe_float(ema100),
                    "ema200": safe_float(ema200),
                    "high52": safe_float(high52),
                    "low52": safe_float(low52),
                    "diff100": safe_float(((curr - ema100)/ema100)*100)
                })
            except: continue
    except: pass
    return details

def fetch_data():
    print("🚀 Starting Analysis...")
    output = {}

    # 1. Get Ticker Tape Data
    output["tickerTape"] = fetch_ticker_tape_data()
    output["etfs"] = []

    # 2. Get ETF Data
    for name, info in etf_map.items():
        try:
            print(f"  Processing {name}...")
            etf = yf.Ticker(info['symbol'])
            hist = etf.history(period="3y") # Need 3y for CAGR

            if hist.empty: continue

            curr = hist['Close'].iloc[-1]
            prev = hist['Close'].iloc[-2]
            change = ((curr - prev) / prev) * 100
            high52 = hist['High'].tail(252).max()
            low52 = hist['Low'].tail(252).min()
            cagr = get_cagr(hist)

            # Chart Data (1 Year Weekly)
            history = []
            weekly = hist.tail(52*5).resample('W').last() # Last ~100 weeks for smooth chart
            for date, row in weekly.iterrows():
                if safe_float(row['Close']):
                    history.append({"date": date.strftime("%Y-%m-%d"), "price": safe_float(row['Close'])})

            output["etfs"].append({
                "id": name,
                "category": info['category'],
                "desc": info['desc'],
                "price": safe_float(curr),
                "change": safe_float(change),
                "high52": safe_float(high52),
                "low52": safe_float(low52),
                "cagr": cagr,
                "history": history,
                "constituents": fetch_constituents(info['constituents'])
            })

        except Exception as e:
            print(f"❌ Error {name}: {e}")

    with open("src/etf_data.json", "w") as f:
        json.dump(output, f)
    print("🎉 Data Saved!")

if __name__ == "__main__":
    fetch_data()
