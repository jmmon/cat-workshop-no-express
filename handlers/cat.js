const url = require('url');
const fs = require('fs');
const path = require('path');
const qs = require('querystring');
const formidable = require('formidable');
const breeds = require('../data/breeds.json');
const cats = require('../data/cats.json');

module.exports = (req, res) => {
    const pathname = url.parse(req.url).pathname;
    if (pathname === '/cats/add-cat' && req.method === 'GET') {
        //implement logic for showing add-cat html view

        let filepath = path.normalize(
            path.join(__dirname, "../views/addCat.html")
        );

        const index = fs.createReadStream(filepath);

        index.on('data', (data) => {
            let catBreedPlaceholder = breeds.map((breed) => `<option value="${breed}">${breed}</option>`);
            let modifiedData = data.toString().replace('{{catBreeds}}', catBreedPlaceholder)
            res.write(modifiedData);
        });

        index.on('end', () => {
            res.end();
        });

        index.on('error', (err) => {
            console.log(err);
        });

    } else if (pathname === '/cats/add-cat' && req.method === 'POST') {
        console.log('add cat post');
        let form = new formidable.IncomingForm();

        form.parse(req, (err, fields, files) => {
            if (err) throw err;
            console.log('~fields:', fields);
            console.log('~files:', files);

            let oldPath = files.upload.path;    //
            let newPath = path.normalize(path.join(__dirname, "../content/images/" + files.upload.name));
            console.log('old path:', oldPath);
            console.log('new path:', newPath);
            console.log('typeof:', typeof oldPath);
            let newId = oldPath.match(/[\A-Za-z0-9]+$/g)[0];
            console.log('id:', newId);
            fs.rename(oldPath, newPath, (err) => {
                if (err) throw err;
                console.log('files was uploaded successfully');
            });

            fs.readFile('./data/cats.json', 'utf-8', (err, data) => {
                if (err) throw err;

                let allCats = JSON.parse(data);
                //allCats.push({ id:CacheStorage.length = 1, ...fields, image: files.upload.name });        //ID not working
                allCats.push({ id:newId, ...fields, image: files.upload.name });
                let json = JSON.stringify(allCats);
                fs.writeFile('./data/cats.json',json, (err) => {
                    if (err) throw err;
                    // res.setHeader("Expires", "Sat, 6 May 1995 12:00:00 GMT");
                    res.writeHead(302, {location: "/"});
                    res.end();
                })
            })
        });

    } else if (pathname === '/cats/add-breed' && req.method === 'GET') {
        let filepath = path.normalize(
            path.join(__dirname, "../views/addBreed.html")
        );

        const index = fs.createReadStream(filepath);

        index.on('data', (data) => {
            res.write(data);
        });

        index.on('end', () => {
            res.end();
        });

        index.on('error', (err) => {
            console.log(err);
        });

    } else if (pathname === '/cats/add-breed' && req.method === 'POST') {
        console.log('add-breed post path');
        let formData = '';
        
        req.on('data', (data) => {
            formData += data;
        });

        req.on('end', () => {
            console.log('formData:', formData);
            let body = qs.parse(formData);
            console.log(body);

            fs.readFile('./data/breeds.json', (err, data) => {
                if (err) {
                    throw err;
                }

                let breeds = JSON.parse(data);
                breeds.push(body.breed);
                let json = JSON.stringify(breeds);

                fs.writeFile('./data/breeds.json', json, 'utf-8', () => console.log('The breed was uploaded successfully'));

            });
            // res.setHeader("Expires", "Sat, 6 May 1995 12:00:00 GMT");
            res.writeHead(302, {
                location: '/'
            });
            res.end();
        });

    } else if (pathname.includes('/cats-edit/') && req.method === 'GET') {
        console.log('get cats-edit');
        let filepath = path.normalize(
            path.join(__dirname, "../views/editCat.html")
        );

        const index = fs.createReadStream(filepath);

        index.on('data', (data) => {
            //console.log('req', req, '\nres', res);
            
            let newId = req.url.match(/[\A-Za-z0-9]+$/g)[0];    //get id from url
            console.log('new id',newId);

            let currentCat = search(cats, newId);

            let modifiedData = data.toString().replace('{{catId}}', newId);
            modifiedData = modifiedData.replace('{{name}}', currentCat.name);
            modifiedData = modifiedData.replace('{{description}}', currentCat.description);

            const breedsAsOptions = breeds.map((b) => `<option value="${b}">${b}</option>`);
            modifiedData = modifiedData.replace('{{catBreeds}}', breedsAsOptions.join('/'));

            modifiedData = modifiedData.replace(`<option value="${currentCat.breed}">`, `<option value="${currentCat.breed}" selected>`);   //select breed
            res.write(modifiedData);
        });

        index.on('end', () => {
            res.end();
        });

        index.on('error', (err) => {
            console.log(err);
        });

    } else if (pathname.includes('/cats-edit/') && req.method === 'POST') {
        let id = pathname.match(/[\A-Za-z0-9]+$/g)[0];
        console.log('post cats-edit');
        //console.log('~req:', req);
        let form = new formidable.IncomingForm();
        //console.log('~form:', form);

        form.parse(req, (err, fields, files) => {
            if (err) throw err;
            console.log('~fields:', fields);
            console.log('~files:', files);

            fs.readFile('./data/cats.json', 'utf-8', (err, data) => {
                if (err) throw err;

                let allCats = JSON.parse(data); //get arr of objects

                let thisCat;
                let thisCatIndex;
                
                for (let i = 0; i < allCats.length; i++) {      //get this cat by matching ID
                    if (allCats[i].id === id) {
                        thisCat = allCats[i];
                        thisCatIndex = i;
                    }
                }

                // [{"id":"e885c49f78e25e268ee0d16eaccca1ff","name":"1","description":"1","breed":"Unknown Breed","image":"cat-jan-11th.png"},{"id":"f90a1118c17317b17d014a78ed0e9217","name":"2","description":"2","breed":"Unknown Breed2","image":"cat-jan-11th.png"},{"id":"373f6a58fca44701f357590cef8d8e56","name":"3","description":"3","breed":"Unknown Breed3","image":"cat-jan-11th.png"}]
                console.log('all cats:', allCats);
                console.log('old data:', thisCat);
                let editedCat = {};
                let keys = Object.keys(fields);
                console.log('fields-keys:', keys);

                editedCat.id = id;    //id wasn't included in form so add it here
                for (let i = 0; i < keys.length; i++) { //add keys from fields (file is excluded, we add file next)
                    if (thisCat[keys[i]] !== fields[keys[i]]) {
                        if (fields[keys[i]] !== undefined) {
                            editedCat[keys[i]] = fields[keys[i]];
                            console.log('~~~ updated', keys[i]);

                        }
                    } else {
                        editedCat[keys[i]] = thisCat[keys[i]];
                        console.log('~~~ carryover', keys[i]);

                    }
                }

                
                if (files.upload.name === '' || thisCat.image === files.upload.name) {
                    editedCat.image = thisCat.image;      //copy over last image to new image

                } else {
                    //process new file
                    editedCat.image = files.upload.name;

                    let oldPath = files.upload.path;
                    let newPath = path.normalize(path.join(__dirname, "../content/images/" + files.upload.name));
                    console.log('old path:', oldPath);
                    console.log('new path:', newPath);
                    // console.log('typeof:', typeof oldPath);

                    fs.rename(oldPath, newPath, (err) => {
                        if (err) throw err;
                        console.log('files was uploaded successfully');
                    });
                    
                }
                

                //write file with new data

                console.log('updated cat info:', editedCat);
                console.log('indexOf', allCats.indexOf(thisCat));
                allCats[allCats.indexOf(thisCat)]= editedCat; //overwrite last cat object with new edited cat object
                let json = JSON.stringify(allCats);
                fs.writeFile('./data/cats.json',json, (err) => {
                    if (err) throw err;
                    // res.setHeader("Expires", "Sat, 6 May 1995 12:00:00 GMT");
                    res.writeHead(302, {location: "/"});
                    res.end();
                })

            })
        });

    } else if (pathname.includes('/cats-find-new-home/') && req.method === 'GET') {
        console.log('get cats-find-new-home');
        let filepath = path.normalize(
            path.join(__dirname, "../views/catShelter.html")
        );

        const index = fs.createReadStream(filepath);

        index.on('data', (data) => {
            //console.log('~req', req, '\n~res', res);
            console.log('~req-url:', req.url);
            let newId = req.url.match(/[\A-Za-z0-9]+$/g)[0];    //get id from url
            console.log('new id',newId);

            let currentCat = search(cats, newId);
            console.log(currentCat);

            let modifiedData = data.toString().replace('{{image}}', currentCat.image);
            //modifiedData = modifiedData.replace('{{imageLoc}}', `${path.join('./content/images/' + currentCat.image)}`);
            modifiedData = modifiedData.replace(/{{name}}/g, currentCat.name);
            modifiedData = modifiedData.replace(/{{catId}}/g, currentCat.id);
            modifiedData = modifiedData.replace('{{description}}', currentCat.description);
            modifiedData = modifiedData.replace(/{{breed}}/g, currentCat.breed);

            res.write(modifiedData);
        });

        index.on('end', () => {
            res.end();
        });

        index.on('error', (err) => {
            console.log(err);
        });

    } else if (pathname.includes('/cats-find-new-home/') && req.method === 'POST') {
        console.log('post cats-find-new-home');

        let id = pathname.match(/[\A-Za-z0-9]+$/g)[0];
        console.log('thisCat id', id);

        fs.readFile('./data/cats.json', 'utf-8', (err, data) => {
            if (err) throw err;

            let allCats = JSON.parse(data); //get arr of objects
            let thisCat = search(allCats, id);

            console.log('all cats:', allCats);
            console.log('this cat data:', thisCat);
            console.log('indexOf', allCats.indexOf(thisCat));

            allCats.splice(allCats.indexOf(thisCat), 1);    //remove thiscat from arr
            let json = JSON.stringify(allCats);
            fs.writeFile('./data/cats.json',json, (err) => {
                if (err) throw err;
                res.writeHead(302, {location: "/"});
                res.end();
            });

        });

    } else {
        return true; //is request not handled
    }
}

function search(arr, val) {
    for (let i=0; i<arr.length; i++) {     //search cats arr and find the cat with the id
        if (arr[i].id === val) {
            return arr[i];
        }
    }
}