const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const cors = require('cors');
const port = 3000;

app.use(cors()); // Habilita CORS
app.use(express.json());

app.post('/checkStringInFiles', (req, res) => {
  const { dir, filter, ext } = req.body;
  const result = searchFilesInDirectory(dir, filter, ext);
  res.json(result);

  console.log("..........Busqueda Finalizada...........")
});

function searchFilesInDirectory(dir, filter, ext) {
  const result = [];
  let totalFiles = 0;
  let totalOccurrences = 0;
  let contador = 1;
  const extensionsCounts = {};
  let previousResults = [];


  if (!fs.existsSync(dir)) {
    console.log(`Specific directory: ${dir} does not exist`);
    return result;
  }

  const files = getFilesInDirectory(dir, '');
  console.log(".......Buscando.........")

  files.forEach(file => {
    const fileContent = fs.readFileSync(file, 'utf-8');
    const rows = fileContent.split(/\r?\n|\r|\n/g);

     // Modificación aquí
     const regex = filter === ".dll"
     ? new RegExp(`(?:[^.]|^)${escapeRegExp(filter)}`, 'i')
     : new RegExp(escapeRegExp(filter), 'i');

    
   /*  const regex = new RegExp(`\\b${escapeRegExp(filter)}\\b`, 'i');  // Uso de escapeRegExp  */
    let occurrencesInFile = 0;
   
    rows.forEach((row, index) => {
      if (regex.test(row)) {

        occurrencesInFile += 1;
        totalOccurrences +=1;

        const min = row.toLowerCase();
        /* const startIdx = min.indexOf(filter);
        const endIdx = startIdx + filter.lengthss; */

        const highlightedRow = row.replace(new RegExp(filter, 'gi'), '<strong>$&</strong>');

        let content =
          contador + ':'
          ' Tu palabra fue encontrada en el archivo ' +
          file +
          ' line: ' +
          (index + 1) +
          ' column: ' +
          min.indexOf(filter) + highlightedRow;

        result.push({ content, file, line: index + 1, column: min.indexOf(filter), totalOccurrences, occurrencesInFile, highlightedRow });

        //Añadir resultado a la lista de resultados previos 
        previousResults.push({ content, file, line: index + 1, column: min.indexOf(filter), totalOccurrences, occurrencesInFile, highlightedRow })

        //Para que no sea una linea continua en el txt
        const resultsTxt = result.map(entry => `${entry.content}\n`).join('');

          try{
            //Tiene que ser una nueva ruta en la que se guarde el archivo
            fs.writeFileSync("C:\\Users\\luz.soriano\\Downloads\\resultados-buscador-axa.txt", resultsTxt, 'utf-8');
          } catch (err){
            console.log(err);
          }

        contador = contador + 1;
        //console.log(result)
      }
    });

    if(occurrencesInFile > 0){
      totalFiles += 1;
      
      const fileExt = path.extname(file).toLocaleLowerCase();
      
      if(fileExt){
        extensionsCounts[fileExt] = (extensionsCounts[fileExt] || 0) + 1;
      }
    }

  });



  return {
    result,
    totalFiles,
    totalOccurrences,
    extensionsCounts
  };
}

// Función para escapar caracteres especiales en una expresión regular
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

////////////////////////////////////////

function getFilesInDirectory(dir, ext) {
  let files = [];

  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);

    const fileExt = path.extname(file).toLocaleLowerCase();
    const ignoredExtensions = ['.dll', '.ocx', '.r'];

    if(!ignoredExtensions.includes(fileExt)){
      if (stat.isDirectory()) {
        const nestedFiles = getFilesInDirectory(filePath, ext);
        files = files.concat(nestedFiles);
      } else {
        if(!ext || path.extname(file) === ext){
          files.push(filePath);
        }
        
      } 
    }

  });

  return files;
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

