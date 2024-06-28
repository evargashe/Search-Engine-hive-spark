document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('results');
    let pageRankData = []; // Aquí almacenaremos los datos de PageRank
    let invertedIndexData = {}; // Aquí almacenaremos los datos del índice invertido

    // Configurar AWS SDK
    AWS.config.update({
        accessKeyId: '',
        secretAccessKey: '', 
        region: 'us-east-2' 
    });

    const s3 = new AWS.S3();
    const bucketName = 'mybucketbig'; 

    // Función para cargar archivos desde S3
    function fetchFileFromS3(fileName, callback) {
        const params = {
            Bucket: bucketName,
            Key: fileName
        };
        s3.getObject(params, function(err, data) {
            if (err) {
                console.error('Error fetching file from S3:', err);
            } else {
                const fileContent = data.Body.toString('utf-8');
                callback(fileContent);
            }
        });
    }

    // Cargar los datos de PageRank desde S3
    fetchFileFromS3('salidarank/part-00000', function(data) {
        pageRankData = parsePageRankData(data);
        searchInput.addEventListener('input', performSearch);
    });

    // Cargar el archivo invertedindex.txt desde S3
    fetchFileFromS3('salidaindice/part-00000', function(data) {
        invertedIndexData = parseInvertedIndexData(data);
    });

    function parsePageRankData(data) {
        const lines = data.split('\n');
        const parsedData = lines.map(line => {
            const parts = line.trim().split(' has rank: ');
            return {
                title: parts[0],
                rank: parseFloat(parts[1])
            };
        });
        return parsedData;
    }

    function parseInvertedIndexData(data) {
        const lines = data.split('\n');
        const parsedData = {};
        lines.forEach(line => {
            if (line.trim()) {
                const parts = line.split(' : ');
                if (parts.length === 2) {
                    const word = parts[0].trim();
                    const documents = parts[1].trim().split(',').map(doc => doc.trim());
                    parsedData[word] = documents;
                }
            }
        });
        return parsedData;
    }

    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const searchWords = searchTerm.split(/\s+/);

        resultsContainer.innerHTML = '';

        if (searchTerm.length === 0) {
            return;
        }

        // Cargar y combinar los datos del JSON y de PageRank
        fetchFileFromS3('paginas.json', function(data) {
            const jsonData = JSON.parse(data);

            // Obtener documentos del índice invertido basados en los términos de búsqueda
            let documentsFromIndex = new Set();
            searchWords.forEach(word => {
                const docs = invertedIndexData[word];
                if (docs) {
                    docs.forEach(doc => documentsFromIndex.add(doc.toLowerCase()));
                }
            });

            const combinedData = jsonData.map(entry => {
                const rankData = pageRankData.find(item => item.title.toLowerCase() === entry.page.title.toLowerCase());
                return {
                    page: entry.page,
                    rank: rankData ? rankData.rank : 0
                };
            });

            combinedData.sort((a, b) => b.rank - a.rank);

            combinedData.forEach(entry => {
                const pageTitle = entry.page.title.toLowerCase();
                const match = searchWords.every(word => pageTitle.includes(word)) || documentsFromIndex.has(pageTitle);
                
                if (match) {
                    const li = document.createElement('li');
                    li.style.marginBottom = '10px'; // Ejemplo de estilo en línea para margen inferior
                    li.style.padding = '10px'; // Ejemplo de estilo en línea para relleno
                    li.style.border = '1px solid #ccc'; // Ejemplo de estilo en línea para borde
                    li.style.backgroundColor = '#f9f9f9'; // Ejemplo de estilo en línea para color de fondo
                    
                    const link = document.createElement('a');
                    link.href = '#'; // No establecer href directamente
                    link.style.textDecoration = 'none'; // Ejemplo de estilo en línea para eliminar subrayado
                    link.style.color = '#333'; // Ejemplo de estilo en línea para color de texto
                    link.style.fontWeight = 'bold'; // Ejemplo de estilo en línea para negrita
                    link.style.transition = 'color 0.3s ease'; // Ejemplo de estilo en línea para transición de color
                    link.textContent = `${entry.page.title} (Rank: ${entry.rank})`;
                    
                    link.addEventListener('click', function(event) {
                        event.preventDefault();
                        redirectToPageDetails(entry.page.title, entry.page.__text);
                    });
                    
                    li.appendChild(link);
                    resultsContainer.appendChild(li);
                }
            });
            
        });
    }

    function redirectToPageDetails(title, text) {
        sessionStorage.setItem('pageTitle', title);
        sessionStorage.setItem('pageText', text);
        window.location.href = 'pagina.html'; // Redirigir a la página de detalles
    }
});
