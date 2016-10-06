var url = require("url");
var fs = require("fs");

// read saz archive
var zip = new require('adm-zip')("sniff.saz");
var zipEntries = zip.getEntries();

zipEntries
	.filter(request)
	//.filter( e => /_c.txt$/.test(e.entryName) ) //sample arrow function
	.map(response)
	.map(endpoint)
	.map(pathAndEncodeSearch)
	.map(newfilename)
	.forEach(function(e) {
		//extract request
	 	extract(e.req).then(
	 		rename(e.req, e.newreq).then(resolveMessage)
	 		.catch(rejectionMessage)
	 	);
	 	//extract response
	 	extract(e.resp).then(
	 		rename(e.resp, e.newresp).then(resolveMessage)
	 		.catch(rejectionMessage)
	 	)
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
	e.newreq = e.req.replace(/_c/, "_request"+e.path);
	e.newresp = e.resp.replace(/_s/, "_response"+e.path);
	return e;
}

function pathAndEncodeSearch(e){
	var urlObj = url.parse(e.endpoint || "");
	e.path = urlObj.pathname.replace(/\//g, "_") + (urlObj.search ? encodeURIComponent(urlObj.search) : "");
	return e;
}

function endpoint(e){
	e.endpoint = zip.readAsText(e.req).split('\n')[0].split(" ")[1] || "";
	return e;
}

function response(e, i, a){
	return {
		req: e.entryName,
		resp: e.entryName.replace(/_c.txt/, "_s.txt")
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