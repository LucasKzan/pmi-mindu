// Coordenadas centrais exatas do Centroide da Sub-Bacia Oficial do Mindu (EPSG:4326)
const MINDU_CENTER = [-3.059891, -59.967774];

// Inicializando o mapa
const map = L.map('map').setView(MINDU_CENTER, 12);

// Adicionando a camada base (Esri)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// ==========================================
// RENDERIZAÇÃO DA GEOMETRIA OFICIAL DA BACIA (mindu_basemap.js)
// ==========================================
const baciaLayer = L.geoJSON(baciaMinduGeoJSON, {
    style: function(feature) {
        switch (feature.properties.tipo) {
            case 'bacia': return { color: '#0284c7', weight: 3, fillColor: '#38bdf8', fillOpacity: 0.18 };
            case 'rio': return { color: '#0055ff', weight: 4 };
            case 'medio_curso': return { color: '#3388ff', fillColor: '#3388ff', fillOpacity: 0.3, weight: 2 };
            case 'baixo_curso': return { color: '#d9534f', fillColor: '#d9534f', fillOpacity: 0.5, weight: 2 };
        }
    },
    onEachFeature: function(feature, layer) {
        if (feature.properties.tipo === 'bacia') {
            layer.bindPopup(`
                <div class="info-panel">
                    <h4 style="color: #0284c7; margin: 0 0 6px 0;">${feature.properties.nome}</h4>
                    <b>Área Total:</b> ${feature.properties.area_km2} km²<br>
                    <b>Perímetro:</b> ${feature.properties.perimetro_km} km<br>
                    <b>Projeção Original:</b> ${feature.properties.epsg_origem}
                </div>
            `);
        } else if (feature.properties.tipo === 'medio_curso' || feature.properties.tipo === 'baixo_curso') {
            const cor = feature.properties.tipo === 'medio_curso' ? '#3388ff' : '#d9534f';
            layer.bindPopup(`
                <div class="info-panel">
                    <h4 style="color: ${cor};">${feature.properties.nome}</h4>
                    <b>Perfil:</b> ${feature.properties.perfil}<br>
                    <b>Vulnerabilidade Social:</b> ${feature.properties.vulnerabilidade}<br>
                    <b>Risco Físico:</b> ${feature.properties.risco}<br>
                </div>
            `);
        } else if (feature.properties.tipo === 'rio') {
            layer.bindPopup('<b>Igarapé do Mindu</b><br>Calha Principal');
        }
    }
}).addTo(map);

// Ajustar o zoom automaticamente para enquadrar perfeitamente a sub-bacia oficial
map.fitBounds(baciaLayer.getBounds(), { padding: [20, 20] });

// ==========================================
// MÓDULO IoT: SENSORES CEMADEN MOCKADOS
// ==========================================

// Sensor no Alto Curso
const sensor1 = L.marker([-3.050, -59.980]).addTo(map);
sensor1.bindPopup("<b>Pluviômetro Cemaden (Alto Curso)</b><br>Chuva acumulada: 45mm/h <br><i>(Status: Chuva Forte)</i>");

// Sensor no Baixo Curso
const sensor2 = L.marker([-3.115, -60.038]).addTo(map);
sensor2.bindPopup("<b>Fluviômetro Cemaden (Baixo Curso)</b><br>Cota do Rio Negro: 28.50m <br><i>(Status: Cota de Alerta - Repiquete iminente)</i>");

// ==========================================
// LEGENDA
// ==========================================
const legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
        <strong>Mapa de Vulnerabilidade</strong><br>
        <i style="background: #3388ff"></i> Médio Curso (Alta Renda)<br>
        <i style="background: #d9534f"></i> Baixo Curso (Vulnerabilidade)<br>
        <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" style="width: 12px; margin-right: 5px;"> Sensor IoT (Cemaden)
    `;
    return div;
};
legend.addTo(map);


// ==========================================
// INTEGRAÇÃO EM TEMPO REAL COM A API
// ==========================================
// Buscando os relatos de Ciência Cidadã que acabamos de inserir no banco
fetch('http://localhost:8000/api/mapa/relatos')
    .then(response => response.json())
    .then(data => {
        console.log("Mágica! Dados carregados da API:", data);
        
        // Criando um pino vermelho chamativo para as denúncias
        const alertIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // O Leaflet lê o GeoJSON nativamente e já desenha no mapa!
        L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {icon: alertIcon});
            },
            onEachFeature: function (feature, layer) {
                const props = feature.properties;
                // O pop-up com os dados que vieram do SQLite
                layer.bindPopup(`
                    <div style="border-left: 4px solid #d9534f; padding-left: 10px; max-width: 250px;">
                        <h4 style="margin: 0 0 5px 0; color: #d9534f;">🚨 Alerta Comunitário</h4>
                        <b>Bairro:</b> ${props.bairro}<br>
                        <b>Nível da Água:</b> <span style="color:red">${props.nivel_agua}</span><br>
                        <b>Relato:</b> <i>"${props.descricao}"</i><br>
                        <br><a href="${props.foto}" target="_blank" style="font-size: 0.8rem; color: #3388ff; text-decoration: none;">📸 Abrir Foto Enviada</a>
                    </div>
                `);
            }
        }).addTo(map);
    })
    .catch(err => console.error("Erro ao buscar API (Verifique se o servidor Python está rodando):", err));
