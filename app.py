from flask import Flask, jsonify, request, render_template
from pyhive import hive

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    search_term = request.form['search_term']
    connection = None
    try:
        connection = hive.Connection(
            host='ec2-35-175-119-192.compute-1.amazonaws.com',
            port=10000,
            username='hadoop'
        )
        cursor = connection.cursor()
        query = f"""
            SELECT
                '{search_term}' AS palabra_buscada,
                concat_ws(' ', collect_list(exploded_enlaces.pagina)) AS nombres_archivos
            FROM (
                SELECT DISTINCT
                    ii.pagina
                FROM indice_inverso ii
                LATERAL VIEW explode(ii.enlaces) enlaces_view AS enlace
                WHERE enlace = '{search_term}'  
            ) exploded_enlaces
            JOIN pagerank pr ON exploded_enlaces.pagina = pr.documento
            GROUP BY '{search_term}'
        """
        cursor.execute(query)
        results = cursor.fetchall()
        return render_template('results.html', search_term=search_term, documentos=results[0][1].split() if results else [])
    except Exception as e:
        return jsonify({'error': str(e)})
    finally:
        if connection:
            connection.close()

@app.route('/document_ajax/<documento>')
def document_ajax(documento):
    connection = None
    try:
        connection = hive.Connection(
            host='ec2-35-175-119-192.compute-1.amazonaws.com',
            port=10000,
            username='hadoop'
        )
        cursor = connection.cursor()
        query = f"SELECT hacia FROM enlaces WHERE desde = '{documento}'"
        cursor.execute(query)
        results = cursor.fetchall()
        return jsonify([result[0] for result in results])
    except Exception as e:
        return jsonify({'error': str(e)})
    finally:
        if connection:
            connection.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
