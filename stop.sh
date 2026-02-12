#!/bin/bash

# GeoCanvas - Stop all running servers

echo "Stopping GeoCanvas..."

killed=0

for port in 8000 3000; do
  pids=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "  Killing process on port $port (PID: $pids)"
    echo "$pids" | xargs kill -9 2>/dev/null
    killed=1
  fi
done

if [ "$killed" -eq 1 ]; then
  echo "All servers stopped."
else
  echo "No running servers found."
fi
