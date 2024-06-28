CREATE EXTERNAL TABLE IF NOT EXISTS enlaces (
    desde STRING,
    hacia STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ' ';

-- Especificar la ubicación en S3 sin cargar automáticamente
ALTER TABLE enlaces SET LOCATION 's3://mybucketbigdata1/output.txt';



-- Crear tabla para guardar los resultados de PageRank
CREATE TABLE IF NOT EXISTS pagerank (
    documento STRING,
    pagerank DOUBLE
);


-- Configuración para el cálculo iterativo de PageRank
SET hive.exec.dynamic.partition.mode=nonstrict;

-- Inicialización de PageRank
INSERT INTO TABLE pagerank
SELECT
    documento,
    1.0  -- Inicialización con un valor de PageRank igual para todos los documentos
FROM (
    SELECT DISTINCT
        desde AS documento
    FROM enlaces
) t;

-- Iteraciones para calcular PageRank
SET hive.exec.dynamic.partition.mode=nonstrict;

-- Número de iteraciones para calcular PageRank
SET max_iterations = 10;

-- Cálculo de PageRank iterativo
INSERT OVERWRITE TABLE pagerank
SELECT
    t.documento,
    0.15 + 0.85 * SUM(p.pagerank / o.outlinks_count) AS pagerank
FROM
    pagerank p
JOIN
    (
        SELECT
            desde AS documento,
            collect_set(hacia) AS outlinks
        FROM
            enlaces
        GROUP BY
            desde
    ) t ON p.documento = t.documento
JOIN
    (
        SELECT
            desde,
            COUNT(*) AS outlinks_count
        FROM
            enlaces
        GROUP BY
            desde
    ) o ON t.documento = o.desde
GROUP BY
    t.documento;





CREATE EXTERNAL TABLE IF NOT EXISTS indice_inverso (
    pagina STRING,
    enlaces ARRAY<STRING>
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE;


INSERT OVERWRITE TABLE indice_inverso
SELECT
    pagina,
    collect_set(enlace) AS enlaces
FROM (
    SELECT
        desde AS pagina,
        hacia AS enlace
    FROM enlaces
) t
GROUP BY pagina;















