#!/bin/bash

# Tarkistaa, että chat-sovellus vastaa odotetusti
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$HTTP_RESPONSE" -eq 200 ]; then
  echo "Chat-sovellus toimii oikein! ✅"
  exit 0
else
  echo "Chat-sovelluksessa ongelma! ❌"
  exit 1
fi
