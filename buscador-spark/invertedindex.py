"""
Example Usage:
spark-submit s3://aws-emr-studio-481641076667-us-east-1/invertedindex.py s3://aws-emr-studio-481641076667-us-east-1/tupla.txt s3://aws-emr-studio-481641076667-us-east-1/salidaindice
"""
import sys
from pyspark.sql import SparkSession
from pyspark.sql.functions import split, collect_list, sort_array

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: invertedindex.py <input_path> <output_path>", file=sys.stderr)
        sys.exit(-1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]


    spark = SparkSession.builder.appName("IndiceInvertido").getOrCreate()

    df = spark.read.text(input_path)


    df = df.withColumn("Titulo", split(df.value, " ")[0]) \
           .withColumn("Palabra", split(df.value, " ")[1]) \
           .drop("value")

    indice_invertido = df.groupBy("Palabra").agg(sort_array(collect_list("Titulo")).alias("Titulos"))

    formatted_rdd = indice_invertido.rdd.map(lambda row: f"{row['Palabra']} : {','.join(row['Titulos'])}")

    formatted_rdd.saveAsTextFile(output_path)

    spark.stop()




    
    

    