var AdmZip = require('adm-zip');
var url = require("url");

// read saz archive
var zip = new AdmZip("sniff.saz");
var zipEntries = zip.getEntries();

zipEntries
	.filter(request)
	.map(response)
	.map(endpoint)
	.map(pathonlyencoded)
	.forEach(function(zipEntry) {
	 	console.log(zipEntry);
	})

function pathonlyencoded(zipEntry){
	zipEntry.path = encodeURIComponent(url.parse(zipEntry.endpoint || "").path);
	return zipEntry;
}

function endpoint(zipEntry){
	zipEntry.endpoint = zip.readAsText(zipEntry.req).split('\n')[0].split(" ")["1"] || "";
	return zipEntry;//(url.parse(strUrl));
}

function request(zipEntry){
	return /_c[.]txt$/.test(zipEntry.entryName);
}

function response(zipEntry){
	return {
		req: zipEntry.entryName,
		resp: zipEntry.entryName.replace(/_c[.]txt/, "_s.txt")
	};
}
