# saz-extract
Extracts and rename saz archives

Inside the Raw folder, there will be three or four files for each web session.
    sessid#_c.txt - contains the raw client request.
    sessid#_s.txt - contains the raw server responses.
    sessid#_m.xml - contains metadata including session flags, socket reuse information, etc.
    sessid#_w.txt - (optional) contains WebSocket messages.

## Install
```bash
$ git clone https://github.com/donniegallardo/saz-extract.git
$ cd saz-extract/
$ npm install -g
```

## Run
```bash
$ saz-extract Sample.saz tmp/output
```
