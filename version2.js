var AdmZip = require('adm-zip');
var url = require("url");
var fs = require("fs");

// read saz archive
var zip = new AdmZip("sniff.saz");
var zipEntries = zip.getEntries();

zipEntries
    .filter(requestOrResponse)
    .map(endpoint) //preamable
    .map(pathAndEncodeSearch) //encode it
    .map(newfilename) //structure a new filename
    .forEach(function(e) {
        //extract filtered and map entries
        extract(e.entryName)
            .then(
                rename(e.entryName, e.newEntryName).then(resolveMessage)
                .catch(rejectionMessage)
            )
            .catch(rejectionMessage);
    })

function rename(entry, newfilename) {
    return new Promise(function(resolve, reject) {
        fs.rename(entry, newfilename, (err) => {
            if (err) throw err;
            else resolve(entry + " renamed to " + newfilename);
        })
    });
}

function extract(entry) {
    return new Promise(function(resolve, reject) {
        zip.extractEntryTo(
            /*entry name*/
            entry,
            /*target path*/
            ".",
            /*maintainEntryPath*/
            true,
            /*overwrite*/
            true) ? resolve("extracted") : reject("failed extraction");
    });
}

function newfilename(e) {
    //regex pattern would do
    //for brevity we just remove known patterns
    var newEntryName;
    if (/_c[.]txt$/.test(e.entryName)) newEntryName = e.entryName.replace(/_c/, "_request" + e.path);
    else newEntryName = e.entryName.replace(/_s/, "_response" + e.path);
    e.newEntryName = newEntryName;
    return e;
}

function pathAndEncodeSearch(e) {
    var urlObj = url.parse(e.endpoint || "");
    e.path = urlObj.pathname && urlObj.pathname.replace(/\//g, "_") + (urlObj.search ? encodeURIComponent(urlObj.search) : "");
    return e;
}

function endpoint(e) {
    var entry = e.entryName;
    if (/_s[.]txt$/.test(entry)) entry = entry.replace(/_s[.]txt/, "_c.txt"); //if response file, get endpoint from corresponding request by replacing _s to _c
    var endpoint = zip.readAsText(entry).split('\n')[0].split(" ")[1] || "";
    return {
        entryName: e.entryName,
        endpoint: endpoint
    };
}

function request(e, i, a) {
    return /_c[.]txt$/.test(e.entryName);
}

function response(e, i, a) {
    return /_s[.]txt$/.test(e.entryName);
}

function requestOrResponse(e, i, a) {
    return request(e, i, a) || response(e, i, a);
}

function resolveMessage(response) {
    console.log(response);
}

function rejectionMessage(reason) {
    console.log(reason);
}
