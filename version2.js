var AdmZip = require('adm-zip');
var url = require("url");
var fs = require("fs");

// read saz archive
var zip = new AdmZip("sniff.saz");
var zipEntries = zip.getEntries();

zipEntries
	.filter(requestAndResponse)
	.map(endpoint) //preamable
	.map(pathAndEncodeSearch) //encode it
	.map(newfilename) //structure a new filename
	.forEach(function(e) {
	 	extract(e.entryName).then(
	 		rename(e.entryName, e.newEntryName).then(resolveMessage)
	 		.catch(rejectionMessage)
	 	);
	})

function resolveMessage(response){
	console.log(response);
}

function rejectionMessage(reason){
	console.log(reason);
}

function rename(entry, newfilename){
	return new Promise(function(resolve, reject){
		fs.rename(entry, newfilename, (err) => {
		  if (err) throw err;
		  else resolve(entry + " renamed to " + newfilename);
		})
	});
}

function extract(entry){
	return new Promise(function(resolve, reject){
		zip.extractEntryTo(
	 		/*entry name*/entry, 
	 		/*target path*/".", 
	 		/*maintainEntryPath*/true, 
	 		/*overwrite*/true)
		? resolve("extracted")
		: ""/*reject("failed extraction")*/;
	});
}

function newfilename(e){
	//regex pattern would do
	//for brevity we just remove known patterns
	var newEntryName;
	if(/_c[.]txt$/.test(e.entryName)) newEntryName = e.entryName.replace(/_c/, "_request"+e.path);
	else newEntryName = e.entryName.replace(/_s/, "_response"+e.path);
	e.newEntryName = newEntryName;
	return e;
}

function pathAndEncodeSearch(e){
	var urlObj = url.parse(e.endpoint || "");
	e.path = urlObj.pathname && urlObj.pathname.replace(/\//g, "_") + (urlObj.search ? encodeURIComponent(urlObj.search) : "");
	return e;
}

function endpoint(e){
	var entry = e.entryName;
	if(/_s[.]txt$/.test(entry)) entry=entry.replace(/_s[.]txt/, "_c.txt"); //if response file, get endpoint from corresponding request by replacing _s to _c
	var endpoint = zip.readAsText(entry).split('\n')[0].split(" ")[1] || "";
	return {
		entryName: e.entryName,
		endpoint: endpoint
	};
}

/*
element
	The current element being processed in the array.
index
	The index of the current element being processed in the array.
array
	The array filter was called upon.*/
function request(e, i, a){
	return /_c[.]txt$/.test(e.entryName);
}

function response(e, i, a){
	return /_s[.]txt$/.test(e.entryName);
}

function requestAndResponse(e, i, a){
	return request(e, i, a) || response(e, i, a);
}