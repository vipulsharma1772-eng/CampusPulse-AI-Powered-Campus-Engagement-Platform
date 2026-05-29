import api from './api';

const getMyCertificates = async () => {
  const response = await api.get('/certificates/my');
  return response.data;
};

const downloadCertificate = async (id) => {
  const response = await api.get(`/certificates/${id}/download`, {
    responseType: 'blob', // Important for PDF
  });
  return response.data;
};

export default {
  getMyCertificates,
  downloadCertificate
};
