import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Accordion } from 'react-bootstrap';
import { docsService } from '../../api/services';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Code2, Download, ExternalLink, Shield } from 'lucide-react';
import { toast } from 'react-toastify';

const ApiDocsPage = () => {
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await docsService.getDocs();
        setDocs(res.data);
      } catch (e) {
        console.error('Error loading API docs', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleDownloadJSON = () => {
    if (!docs) return;
    const blob = new Blob([JSON.stringify(docs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ERP_OpenAPI_Spec.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('OpenAPI / Postman specification downloaded!');
  };

  if (loading) {
    return <LoadingSpinner message="Loading API specification..." />;
  }

  const paths = docs?.paths || {};

  return (
    <div className="pb-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">REST API & Schema Explorer</h4>
          <p className="text-muted small mb-0">Complete OpenAPI 3.0 endpoints specification for the ERP backend.</p>
        </div>
        <Button variant="outline-primary" size="sm" onClick={handleDownloadJSON} className="d-flex align-items-center gap-1.5">
          <Download size={15} />
          <span>Download OpenAPI JSON</span>
        </Button>
      </div>

      <div className="erp-card p-4 mb-4">
        <h6 className="fw-bold text-dark mb-2">Base Server URI</h6>
        <div className="p-2.5 bg-light rounded border text-monospace small text-primary fw-semibold">
          http://localhost:5000/api
        </div>
        <div className="mt-3 text-muted small">
          <strong>Authentication:</strong> All protected routes require a Bearer token in the request header:
          <code className="d-block mt-1 p-2 bg-light border rounded">Authorization: Bearer &lt;JWT_TOKEN&gt;</code>
        </div>
      </div>

      <div className="erp-card p-4">
        <h6 className="fw-bold text-dark mb-3">API Route Catalog</h6>
        <div className="d-flex flex-column gap-2">
          {Object.entries(paths).map(([route, methods], idx) => (
            <div key={idx} className="p-3 border rounded-3 bg-white">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="d-flex align-items-center gap-2">
                  <code className="fw-bold text-dark fs-6">{route}</code>
                </div>
                <div className="d-flex gap-1">
                  {Object.keys(methods).map((m) => {
                    const methodUpper = m.toUpperCase();
                    let variant = 'primary';
                    if (methodUpper === 'GET') variant = 'success';
                    if (methodUpper === 'POST') variant = 'primary';
                    if (methodUpper === 'PUT') variant = 'warning';
                    if (methodUpper === 'DELETE') variant = 'danger';

                    return (
                      <span key={m} className={`badge bg-${variant} text-uppercase px-2`}>
                        {methodUpper}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="mt-2 text-muted small">
                {Object.values(methods)[0]?.summary || 'ERP API Endpoint'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
