import sqlite3
import os

# Caminho para o banco de dados SQLite de teste (na raiz do projeto onde o main foi executado)
db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'sigweb_teste.db')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Criando 3 relatos reais que refletem a nossa tese de Racismo Ambiental
    relatos = [
        (
            "1234", 
            "São Raimundo", 
            "Água no joelho (Palafita)", 
            "O repiquete do Rio Negro bateu de madrugada e misturou com a enxurrada do Mindu. Perdi geladeira e colchão. Não temos saneamento.", 
            "https://imgur.com/foto_saoraimundo.jpg", 
            -3.115, 
            -60.038
        ),
        (
            "5678", 
            "Parque 10 de Novembro", 
            "Lâmina de água no asfalto", 
            "Chuva muito forte, a rua virou um rio rapidamente por falta de escoamento. A água correu rápido para o igarapé, mas levou as lixeiras.", 
            "https://imgur.com/foto_parque10.jpg", 
            -3.076, 
            -60.010
        ),
        (
            "9012", 
            "Bairro da Glória", 
            "Água na cintura", 
            "A água podre do igarapé invadiu minha casa. Tenho crianças pequenas e estamos com medo de surto de leptospirose como no ano passado.", 
            "https://imgur.com/foto_gloria.jpg", 
            -3.120, 
            -60.035
        )
    ]

    cursor.executemany('''
        INSERT INTO relatos_comunidade (
            telefone_anonimizado, bairro_relatado, nivel_agua_estimado, 
            descricao, url_foto, latitude, longitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', relatos)

    conn.commit()
    print("3 relatos inseridos com sucesso!")

except Exception as e:
    print(f"Erro: {e}")
finally:
    if conn:
        conn.close()
