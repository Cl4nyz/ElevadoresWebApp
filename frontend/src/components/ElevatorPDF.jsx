import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { LOGO_BASE64 } from '../constants/images';

// Create styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 10,
  },
  header: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'solid',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    backgroundColor: '#f8f9fa',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  column: {
    flexDirection: 'column',
    flex: 1,
    marginRight: 10,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#666',
  },
  value: {
    fontSize: 10,
    color: '#333',
    marginBottom: 8,
  },
  cabineDrawing: {
    width: 160,
    height: 100,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'solid',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
	position: 'relative',
    // alignSelf: 'center',
    // marginTop: 10,
    // marginBottom: 10,
  },
  cabineText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6c757d',
    textAlign: 'center',
  },
  colunaDrawing: {
    width: 60,
    height: 40,
    backgroundColor: '#6c757d',
    borderWidth: 2,
    borderColor: '#495057',
    borderStyle: 'solid',
    alignSelf: 'center',
    marginTop: -2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colunaText: {
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  arrowContainer: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  legendText: {
    fontSize: 9,
  },
  arrowEntrada: {
    backgroundColor: '#28a745',
  },
  arrowSaida: {
    backgroundColor: '#dc3545',
  },
  arrowColuna: {
    backgroundColor: '#6c757d',
  },
drawingContainer: {
  alignSelf: 'center',
  marginTop: 10,
  marginBottom: 10,
},
cabineContainer: {
  position: 'relative',
  alignSelf: 'center',
},
arrow: {
  position: 'absolute',
  width: 20,
  height: 20,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 2,
},
arrowText: {
  fontSize: 8,
  fontWeight: 'bold',
  color: 'white',
  textAlign: 'center',
},
// Arrow positioning
arrowLeft: {
  left: -25,
  top: 40, // Middle of cabin
},
arrowRight: {
  right: -25,
  top: 40, // Middle of cabin
},
arrowTop: {
  top: -25,
  left: 70, // Middle of cabin width
},
arrowBottom: {
  bottom: -65, // Below the column space
  left: 70, // Middle of cabin width
},
// Overlap positioning adjustments
arrowLeftTop: {
  top: 25,
},
arrowLeftBottom: {
  top: 55,
},
arrowRightTop: {
  top: 25,
},
arrowRightBottom: {
  top: 55,
},
arrowTopLeft: {
  left: 55,
},
arrowBottomRight: {
  left: 85,
},
watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0, // Behind content
  },
  watermarkImage: {
    width: 300,
    height: 300,
    opacity: 0.1, // Low opacity for watermark effect
  },
  watermarkText: {
    fontSize: 48,
    color: '#cccccc',
    opacity: 0.2,
    transform: 'rotate(-45deg)',
    position: 'absolute',
    top: '50%',
    left: '50%',
    textAlign: 'center',
  },
  pageContent: {
    position: 'relative',
    zIndex: 1, // Above watermark
    flex: 1,
  },
});

const ElevatorPDF = ({ elevador, cliente, contrato }) => {
  const formatarData = (data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const renderCabineDrawing = () => {
	const entrada = elevador.cabine?.lado_entrada?.toLowerCase();
	const saida = elevador.cabine?.lado_saida?.toLowerCase();
	
	// Check for overlap (same side)
	const mesmoLado = entrada && saida && 
		((entrada === 'esquerda' || entrada === 'esquerdo') && (saida === 'esquerda' || saida === 'esquerdo')) ||
		((entrada === 'direita' || entrada === 'direito') && (saida === 'direita' || saida === 'direito')) ||
		((entrada === 'oposta' || entrada === 'oposto') && (saida === 'oposta' || saida === 'oposto'));
	
	return (
		<View style={styles.drawingContainer}>
		{/* Container for cabin and arrows */}
		<View style={styles.cabineContainer}>
			
			{/* Entrance arrows */}
			{entrada === 'esquerdo' || entrada === 'esquerda' ? (
			<View style={[
				styles.arrow, 
				styles.arrowEntrada, 
				styles.arrowLeft,
				mesmoLado && styles.arrowLeftTop
			]}>
				<Text style={styles.arrowText}>E</Text>
			</View>
			) : null}
			
			{entrada === 'direito' || entrada === 'direita' ? (
			<View style={[
				styles.arrow, 
				styles.arrowEntrada, 
				styles.arrowRight,
				mesmoLado && styles.arrowRightTop
			]}>
				<Text style={styles.arrowText}>E</Text>
			</View>
			) : null}
			
			{entrada === 'oposto' || entrada === 'oposta' ? (
			<View style={[
				styles.arrow, 
				styles.arrowEntrada, 
				styles.arrowTop,
				mesmoLado && styles.arrowTopLeft
			]}>
				<Text style={styles.arrowText}>E</Text>
			</View>
			) : null}
			
			{/* Exit arrows */}
			{saida === 'esquerdo' || saida === 'esquerda' ? (
			<View style={[
				styles.arrow, 
				styles.arrowSaida, 
				styles.arrowLeft,
				mesmoLado && styles.arrowLeftBottom
			]}>
				<Text style={styles.arrowText}>S</Text>
			</View>
			) : null}
			
			{saida === 'direito' || saida === 'direita' ? (
			<View style={[
				styles.arrow, 
				styles.arrowSaida, 
				styles.arrowRight,
				mesmoLado && styles.arrowRightBottom
			]}>
				<Text style={styles.arrowText}>S</Text>
			</View>
			) : null}
			
			{saida === 'oposto' || saida === 'oposta' ? (
			<View style={[
				styles.arrow, 
				styles.arrowSaida, 
				styles.arrowBottom,
				mesmoLado && styles.arrowBottomRight
			]}>
				<Text style={styles.arrowText}>S</Text>
			</View>
			) : null}
			
			{/* Main cabin rectangle */}
			<View style={styles.cabineDrawing}>
			<Text style={styles.cabineText}>CABINE</Text>
			</View>
		</View>
		
		{/* Column rectangle if exists */}
		{elevador.coluna?.elevacao && (
			<View style={styles.colunaDrawing}>
			<Text style={styles.colunaText}>COL</Text>
			</View>
		)}
		
		{/* Legend */}
		<View style={styles.legend}>
			{entrada && (
			<View style={styles.legendItem}>
				<View style={[styles.legendColor, styles.arrowEntrada]} />
				<Text style={styles.legendText}>
				Entrada: {elevador.cabine.lado_entrada}
				</Text>
			</View>
			)}
			{saida && (
			<View style={styles.legendItem}>
				<View style={[styles.legendColor, styles.arrowSaida]} />
				<Text style={styles.legendText}>
				Saída: {elevador.cabine.lado_saida}
				</Text>
			</View>
			)}
		</View>
		</View>
	);
	};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark Layer */}
        {/* <View style={styles.watermarkContainer}>
          <Image 
            style={styles.watermarkImage}
            src={LOGO_BASE64} // Use the base64 string
          />
        </View> */}
      
      {/* Main Content Layer */}
      <View style={styles.pageContent}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>#{elevador.id} - {cliente?.nome || 'N/A'}</Text>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Data da Venda:</Text>
                <Text style={styles.value}>{formatarData(contrato?.data_venda)}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Data de Entrega:</Text>
                <Text style={styles.value}>{formatarData(contrato?.data_entrega)}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Cor:</Text>
                <Text style={styles.value}>{elevador.cor || 'N/A'}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Comando:</Text>
                <Text style={styles.value}>{elevador.comando || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.row}>
            </View>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Porta Inferior:</Text>
                <Text style={styles.value}>{elevador.porta_inferior || 'N/A'}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Porta Superior:</Text>
                <Text style={styles.value}>{elevador.porta_superior || 'N/A'}</Text>
              </View>
            </View>
            {elevador.observacao && (
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Observação:</Text>
                  <Text style={styles.value}>{elevador.observacao}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Cabin Information */}
          {elevador.cabine && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cabine</Text>
              
              {/* Cabin Drawing */}
              {renderCabineDrawing()}
              
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Altura:</Text>
                  <Text style={styles.value}>{elevador.cabine.altura || 'N/A'} mm</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Largura:</Text>
                  <Text style={styles.value}>{elevador.cabine.largura || 'N/A'} mm</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Profundidade:</Text>
                  <Text style={styles.value}>{elevador.cabine.profundidade || 'N/A'} mm</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Piso:</Text>
                  <Text style={styles.value}>{elevador.cabine.piso || 'N/A'}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Montada:</Text>
                  <Text style={styles.value}>{elevador.cabine.montada ? 'Sim' : 'Não'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Column Information */}
          {elevador.coluna && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Coluna</Text>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Elevação:</Text>
                  <Text style={styles.value}>{elevador.coluna.elevacao || 'N/A'} mm</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Montada:</Text>
                  <Text style={styles.value}>{elevador.coluna.montada ? 'Sim' : 'Não'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Additional Information */}
          {elevador.adicionais && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Adicionais</Text>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Cancela:</Text>
                  <Text style={styles.value}>{elevador.adicionais.cancela || 0}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Porta:</Text>
                  <Text style={styles.value}>{elevador.adicionais.porta || 0}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Portão:</Text>
                  <Text style={styles.value}>{elevador.adicionais.portao || 0}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Barreira Eletrônica:</Text>
                  <Text style={styles.value}>{elevador.adicionais.barreira_eletronica || 0}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Lados Enclausuramento:</Text>
                  <Text style={styles.value}>{elevador.adicionais.lados_enclausuramento || 0}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Sensor Esmagamento:</Text>
                  <Text style={styles.value}>{elevador.adicionais.sensor_esmagamento || 0}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Rampa Acesso:</Text>
                  <Text style={styles.value}>{elevador.adicionais.rampa_acesso || 0}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Nobreak:</Text>
                  <Text style={styles.value}>{elevador.adicionais.nobreak || 0}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Galvanizada:</Text>
                  <Text style={styles.value}>{elevador.adicionais.galvanizada ? 'Sim' : 'Não'}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default ElevatorPDF;