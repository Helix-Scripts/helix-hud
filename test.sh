#!/bin/bash
cd "$(dirname "$0")"
busted tests/ --verbose --pattern '_spec'
