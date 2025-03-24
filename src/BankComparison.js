import React, { useState } from 'react';

// Komponente zum Auswählen und Vergleichen von Banken
export const useBankComparison = () => {
  // State für ausgewählte Banken (maximal 3)
  const [selectedBanks, setSelectedBanks] = useState([]);
  // State für das Vergleichs-Modal
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Bank auswählen oder abwählen
  const toggleBankSelection = (bank) => {
    // Prüfen, ob die Bank bereits ausgewählt ist
    const isAlreadySelected = selectedBanks.some(selected => selected.id === bank.id);
    
    if (isAlreadySelected) {
      // Bank aus der Auswahl entfernen
      setSelectedBanks(selectedBanks.filter(selected => selected.id !== bank.id));
    } else {
      // Bank zur Auswahl hinzufügen (maximal 3)
      if (selectedBanks.length < 3) {
        setSelectedBanks([...selectedBanks, bank]);
      } else {
        // Optional: Hinweis anzeigen, dass maximal 3 Banken ausgewählt werden können
        alert('Maximal 3 Banken können zum Vergleich ausgewählt werden.');
      }
    }
  };

  // Alle ausgewählten Banken entfernen
  const clearSelectedBanks = () => {
    setSelectedBanks([]);
  };

  // Bank aus der Auswahl entfernen
  const removeSelectedBank = (bankId) => {
    setSelectedBanks(selectedBanks.filter(bank => bank.id !== bankId));
  };

  // Vergleichsfenster öffnen
  const openComparisonModal = () => {
    if (selectedBanks.length > 0) {
      setShowComparisonModal(true);
    } else {
      alert('Bitte wählen Sie mindestens eine Bank zum Vergleich aus.');
    }
  };

  // Vergleichsfenster schließen
  const closeComparisonModal = () => {
    setShowComparisonModal(false);
  };

  return {
    selectedBanks,
    showComparisonModal,
    toggleBankSelection,
    clearSelectedBanks,
    removeSelectedBank,
    openComparisonModal,
    closeComparisonModal
  };
};

// Komponente zur Anzeige des "Banken vergleichen"-Buttons
// Komponente zur Anzeige des "Banken vergleichen"-Buttons
export const CompareButton = ({ openComparisonModal, selectedCount }) => {
  return (
    <button 
      className={`compare-button ${selectedCount === 0 ? 'compare-button-disabled' : ''}`}
      onClick={openComparisonModal}
      disabled={selectedCount === 0}
    >
      Banken vergleichen ({selectedCount}/3)
    </button>
  );
};

// Komponente für das Modal zum Vergleich der Banken
export const ComparisonModal = ({ 
  isOpen, 
  onClose, 
  banks, 
  onRemoveBank 
}) => {
  if (!isOpen) return null;

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 2000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };

  const modalContentStyle = {
    backgroundColor: '#1f1f1f',
    color: 'white',
    borderRadius: '10px',
    padding: '20px',
    maxWidth: '90%',
    width: '900px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative'
  };

  const modalHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #333',
    paddingBottom: '10px'
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: '24px',
    cursor: 'pointer'
  };

  const comparisonTableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  const headerCellStyle = {
    padding: '10px',
    textAlign: 'left',
    borderBottom: '1px solid #333',
    color: '#999'
  };

  const firstColumnStyle = {
    width: '20%',
    fontWeight: 'bold',
    padding: '10px',
    borderBottom: '1px solid #333',
    color: '#999'
  };

  const cellStyle = {
    padding: '10px',
    borderBottom: '1px solid #333'
  };

  const bankHeaderStyle = {
    position: 'relative',
    padding: '10px',
    fontWeight: 'bold',
    borderBottom: '1px solid #333',
    textAlign: 'center'
  };

  const removeButtonStyle = {
    position: 'absolute',
    top: '5px',
    right: '5px',
    background: 'none',
    border: 'none',
    color: '#e74c3c',
    cursor: 'pointer',
    fontSize: '16px'
  };

  const getAchievementColor = (achievement) => {
    if (achievement < 40) return '#e74c3c'; // Rot
    if (achievement < 70) return '#e67e22'; // Orange
    if (achievement < 90) return '#f1c40f'; // Gelb
    return '#2ecc71'; // Grün
  };

  const progressBarContainerStyle = {
    height: '6px',
    width: '100%',
    backgroundColor: '#333',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '5px'
  };

  const getProgressBarStyle = (achievement) => {
    return {
      height: '100%',
      width: `${Math.min(achievement, 100)}%`,
      backgroundColor: getAchievementColor(achievement)
    };
  };

  // Berechnung der Durchschnittswerte
  const calculateAverages = () => {
    if (banks.length === 0) return null;
    
    const totalAchievement = banks.reduce((sum, bank) => sum + bank.achievement, 0);
    const totalEmployees = banks.reduce((sum, bank) => sum + bank.employees, 0);
    
    return {
      averageAchievement: (totalAchievement / banks.length).toFixed(1),
      averageEmployees: (totalEmployees / banks.length).toFixed(1)
    };
  };

  const averages = calculateAverages();

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <h2>Banken im Vergleich</h2>
          <button style={closeButtonStyle} onClick={onClose}>×</button>
        </div>

        {banks.length > 0 ? (
          <table style={comparisonTableStyle}>
            <thead>
              <tr>
                <th style={headerCellStyle}></th>
                {banks.map(bank => (
                  <th key={bank.id} style={bankHeaderStyle}>
                    {bank.name}
                    <button 
                      style={removeButtonStyle} 
                      onClick={() => onRemoveBank(bank.id)}
                    >
                      ×
                    </button>
                  </th>
                ))}
                {banks.length > 1 && (
                  <th style={bankHeaderStyle}>Durchschnitt</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={firstColumnStyle}>Standort</td>
                {banks.map(bank => (
                  <td key={bank.id} style={cellStyle}>
                    {bank.address.street}, {bank.address.zipCode} {bank.address.city}
                  </td>
                ))}
                {banks.length > 1 && (
                  <td style={cellStyle}>-</td>
                )}
              </tr>
              <tr>
                <td style={firstColumnStyle}>Filialleiter</td>
                {banks.map(bank => (
                  <td key={bank.id} style={cellStyle}>{bank.branchManager}</td>
                ))}
                {banks.length > 1 && (
                  <td style={cellStyle}>-</td>
                )}
              </tr>
              <tr>
                <td style={firstColumnStyle}>Zielerreichung</td>
                {banks.map(bank => (
                  <td key={bank.id} style={cellStyle}>
                    <div style={{color: getAchievementColor(bank.achievement)}}>
                      {bank.achievement}%
                    </div>
                    <div style={progressBarContainerStyle}>
                      <div style={getProgressBarStyle(bank.achievement)}></div>
                    </div>
                  </td>
                ))}
                {banks.length > 1 && averages && (
                  <td style={cellStyle}>
                    <div style={{color: getAchievementColor(averages.averageAchievement)}}>
                      {averages.averageAchievement}%
                    </div>
                    <div style={progressBarContainerStyle}>
                      <div style={getProgressBarStyle(averages.averageAchievement)}></div>
                    </div>
                  </td>
                )}
              </tr>
              <tr>
                <td style={firstColumnStyle}>Mitarbeiter</td>
                {banks.map(bank => (
                  <td key={bank.id} style={cellStyle}>{bank.employees}</td>
                ))}
                {banks.length > 1 && averages && (
                  <td style={cellStyle}>{averages.averageEmployees}</td>
                )}
              </tr>
              <tr>
                <td style={firstColumnStyle}>Gegründet</td>
                {banks.map(bank => (
                  <td key={bank.id} style={cellStyle}>{bank.foundingYear}</td>
                ))}
                {banks.length > 1 && (
                  <td style={cellStyle}>-</td>
                )}
              </tr>
              <tr>
                <td style={firstColumnStyle}>Versicherungs-ansprechpartner</td>
                {banks.map(bank => (
                  <td key={bank.id} style={cellStyle}>{bank.insuranceContact}</td>
                ))}
                {banks.length > 1 && (
                  <td style={cellStyle}>-</td>
                )}
              </tr>
            </tbody>
          </table>
        ) : (
          <p>Keine Banken zum Vergleich ausgewählt.</p>
        )}
      </div>
    </div>
  );
};