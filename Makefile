.PHONY: testing test test-client test-server

testing: test

test: test-client test-server

test-client:
	cd client && npm run lint

test-server:
	cd server && python3 -m pytest -q
