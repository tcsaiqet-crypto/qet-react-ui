# Architecture & Implementation Plan: ISS-007

## 1. 5-Pass JSON Auto-Repair Engine Architecture

```
[ Raw Gemini Response String ]
              │
              ▼
    [ Pass 1: Direct json.loads ] ──(Success)──► [ Return Parsed JSON ]
              │ (Error)
              ▼
    [ Pass 2: Strip Markdown Fences ] ──(Success)──► [ Return Parsed JSON ]
              │ (Error)
              ▼
    [ Pass 3: Regex Extract First/Last Brackets ] ──(Success)──► [ Return Parsed JSON ]
              │ (Error)
              ▼
    [ Pass 4: Balance Braces & Fix Trailing Commas ] ──(Success)──► [ Return Parsed JSON ]
              │ (Error)
              ▼
    [ Pass 5: Fallback Pydantic Default Generator ] ──► [ Emit Warning & Return Schema ]
```

## 2. Bracket Balancing Algorithm
```python
def balance_json_brackets(text: str) -> str:
    # 1. Clean trailing commas
    text = re.sub(r',\s*([\]}])', r'\1', text)
    
    # 2. Check unclosed quote
    quote_count = text.count('"') - text.count('\\"')
    if quote_count % 2 != 0:
        text += '"'
        
    # 3. Balance braces and brackets
    open_braces = text.count('{') - text.count('}')
    open_brackets = text.count('[') - text.count(']')
    
    if open_brackets > 0:
        text += ']' * open_brackets
    if open_braces > 0:
        text += '}' * open_braces
        
    return text
```
