// Support for ES6 modules first needs to land in V8. 
// The tracking bug is <https://bugs.chromium.org/p/v8/issues/detail?id=1569>
// but it's blocked by finalization of the module loader spec.
// import * as url from 'url';
// import * as fs from 'fs';

const url = require('url');
const fs = require('fs');

// read saz archive
const saz = new require('adm-zip')('sniff.saz');

// good
// const regexreq = /_c[.]txt$/;
// const regexresp = /_s[.]txt$/;

// better/best. but depends on some cases. this case not easily readable for me.
const [regexreq, regexresp] = [/_c[.]txt$/, /_s[.]txt$/];

saz.getEntries()
    //.filter(requestOrResponse)
    .filter((e) => regexreq.test(e.entryName) || regexresp.test(e.entryName)) // sample arrow function
    .map(endpoint) //preamable
    .map(pathAndEncodeSearch) //encode it
    .map(newfilename) //structure a new filename
    .forEach(extractAndRename) //extract then rename it

/*
Inside a SAZ file, you will find:
    _index.htm - an optional file containing a human readable version of the Session List. This file is not processed when loading a .SAZ file and exists solely for manual examination.
    [Content_Types.xml] — (Added in v2.4.0.9) A metadata file which specifies a few MIME types so the archive can be read by System.IO.Packaging or other clients that support the Open Packaging Conventions.
    a raw folder - containing files representing each web session.

Inside the Raw folder, there will be three or four files for each web session.
    sessid#_c.txt - contains the raw client request.
    sessid#_s.txt - contains the raw server request.
    sessid#_m.xml - contains metadata including session flags, socket reuse information, etc.
    sessid#_w.txt - (optional) contains WebSocket messages.
*/

function extractAndRename(e) {
    //extract filtered and map entries
    //console.log(e);
    extract(e.entryName)
        .then(
            rename(e.entryName, e.newEntryName).then(resolveMessage)
            .catch(rejectionMessage)
        )
        .catch(rejectionMessage);

    function extract(entry) {
        return new Promise(function(resolve, reject) {
            saz.extractEntryTo(
                /*entry name*/
                entry,
                /*target path*/
                '.',
                /*maintainEntryPath*/
                true,
                /*overwrite*/
                true) ? resolve('extracted') : reject('failed extraction');
        });
    }

    function rename(entry, newfilename) {
        return new Promise(function(resolve, reject) {
            fs.rename(entry, newfilename, (err) => {
                if (err) throw err;
                else resolve(`${entry} renamed to ${newfilename}`);
            })
        });
    }

    function resolveMessage(response) {
        console.log(response);
    }

    function rejectionMessage(reason) {
        console.log(reason);
    }
}

function newfilename(e) {

    e.newEntryName = checkRequestEntryName() ? createReqFileName() : createRespFileName();
    return e;

    function checkRequestEntryName() {
        return (regexreq.test(e.entryName));
    }

    function createReqFileName() {
        return e.entryName.replace(/_c/, `_req${e.path}`);
    }

    function createRespFileName() {
        return e.entryName.replace(/_s/, `_resp${e.path}`);
    }
}

function pathAndEncodeSearch(e) {
    const urlObj = url.parse(e.endpoint || '');
    e.path = urlObj.pathname && `${replaceFwdSlashWithUnderscore()}${encodeSearch()}`;
    return e;

    function replaceFwdSlashWithUnderscore() {
        return urlObj.pathname.replace(/\//g, '_');
    }

    function encodeSearch() {
        return (urlObj.search ? encodeURIComponent(urlObj.search) : '');
    }
}

function endpoint(e) {

    const endpoint = readPreamble() || '';
    return {
        entryName: e.entryName,
        endpoint: endpoint,
    };

    function readPreamble() {
        //if response file, get endpoint from corresponding request by replacing _s to _c then extract preamble from request
        const entry = checkResponseEntryName() ? replaceEntryName() : e.entryName;
        return saz.readAsText(entry).split('\n')[0].split(' ')[1]
    }

    function checkResponseEntryName() {
        return (regexresp.test(e.entryName));
    }

    function replaceEntryName() {
        return e.entryName.replace(regexresp, '_c.txt');
    }
}

function requestOrResponse(e, i, a) {
    return regexreq.test(e.entryName) || regexresp.test(e.entryName);
}
