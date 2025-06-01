import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import { certificationsService } from '../../services/api'; // Adjust path as needed
import { AxiosError } from 'axios';
import { Award, PlusCircle, Save, XCircle, Edit3, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorUtils';

// Assuming these types are defined in your services/api.ts or a types file
interface Certification {
  id: number;
  name: string;
  issuing_organization: string;
  issue_date: string; // Consider using Date type if you parse/format it
  expiration_date?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
}

interface CertificationCreate {
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date?: string;
  credential_id?: string;
  credential_url?: string;
}

interface CertificationUpdate extends Partial<CertificationCreate> {}

interface CertificationsSectionProps {
  token: string | null;
  onUnauthorized: () => void;
}

const CertificationsSection: React.FC<CertificationsSectionProps> = ({ token, onUnauthorized }) => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [formData, setFormData] = useState<CertificationCreate>({
    name: '',
    issuing_organization: '',
    issue_date: '',
    expiration_date: '',
    credential_id: '',
    credential_url: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  const [showForm, setShowForm] = useState(false);

  const apiConfig = useMemo(() => ({ // Memoize apiConfig
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  const fetchCertifications = useCallback(async () => {
    if (!token) {
      // setError('Authentication token not found. Please log in.'); // Optional: inform user
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedCertifications = await certificationsService.getAll<Certification[]>(undefined, apiConfig); // Use memoized apiConfig
      setCertifications(fetchedCertifications);
    } catch (err: any) {
      console.error("Failed to load certifications:", err);      if (err.isAxiosError && err.response && err.response.status === 401) {
        onUnauthorized();
      } else {
        setError(extractErrorMessage(err, 'Failed to load certifications. Please try again later.'));
      }
    }
    setIsLoading(false);
  }, [token, onUnauthorized, apiConfig]); // Added apiConfig to dependencies

  useEffect(() => {
    fetchCertifications();
  }, [fetchCertifications]);

  const resetForm = () => {
    setFormData({
      name: '',
      issuing_organization: '',
      issue_date: '',
      expiration_date: '',
      credential_id: '',
      credential_url: '',
    });
    setError(null);
    setSuccessMessage(null);
    setEditingCertification(null);
    setShowForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const prepareDataForApi = (data: CertificationCreate | CertificationUpdate): CertificationCreate | CertificationUpdate => {
    const processedData: any = { ...data };
    // Convert empty strings for optional fields to undefined, so they are omitted by axios if not provided
    const optionalFields: (keyof (CertificationCreate | CertificationUpdate))[] = ['expiration_date', 'credential_id', 'credential_url'];
    optionalFields.forEach(field => {
      if (processedData[field] === '' || processedData[field] === null) {
        processedData[field] = undefined;
      }
    });
    return processedData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.issuing_organization || !formData.issue_date) {
      setError('Name, Issuing Organization, and Issue Date are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const apiData = prepareDataForApi(formData);

    try {
      if (editingCertification) {
        const updatedCertification = await certificationsService.update<Certification>(
          editingCertification.id,
          apiData as CertificationUpdate,
          apiConfig // Use memoized apiConfig
        );
        setCertifications(certifications.map(cert =>
          cert.id === updatedCertification.id ? updatedCertification : cert
        ));
        setSuccessMessage('Certification updated successfully!');
      } else {
        const newCertification = await certificationsService.create<Certification>(
          apiData as CertificationCreate,
          apiConfig // Use memoized apiConfig
        );
        setCertifications([...certifications, newCertification]);
        setSuccessMessage('Certification added successfully!');
      }
      resetForm();
      // Optionally, re-fetch all certifications to ensure data consistency
      // await fetchCertifications(); 
    } catch (err: any) {
      console.error(editingCertification ? "Failed to update certification:" : "Failed to add certification:", err);
      if (err.isAxiosError && err.response && err.response.status === 401) {
        onUnauthorized();
      }
      const errorData = err.response?.data;
      let errorMessage = editingCertification ? 'Failed to update certification.' : 'Failed to add certification.';
      if (errorData && errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((d: any) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join('; ');
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      }
      setError(errorMessage);
    }
    setIsSubmitting(false);
  };

  const handleEdit = (certificationToEdit: Certification) => {
    setEditingCertification(certificationToEdit);
    setFormData({
      name: certificationToEdit.name,
      issuing_organization: certificationToEdit.issuing_organization,
      issue_date: certificationToEdit.issue_date, // Assuming date is stored as YYYY-MM-DD
      expiration_date: certificationToEdit.expiration_date || '',
      credential_id: certificationToEdit.credential_id || '',
      credential_url: certificationToEdit.credential_url || '',
    });
    setShowForm(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleDelete = async (certificationId: number) => {
    if (!window.confirm('Are you sure you want to delete this certification?')) return;

    setIsSubmitting(true); // Use isSubmitting to disable buttons during delete
    setError(null);
    setSuccessMessage(null);
    try {
      await certificationsService.delete(certificationId, apiConfig); // Use memoized apiConfig
      setCertifications(certifications.filter(cert => cert.id !== certificationId));
      setSuccessMessage('Certification deleted successfully!');
      if (editingCertification && editingCertification.id === certificationId) {
        resetForm(); // If deleting the item currently being edited, reset form
      }
    } catch (err: any) {
      console.error("Failed to delete certification:", err);      if (err.isAxiosError && err.response && err.response.status === 401) {
        onUnauthorized();
      } else {
        setError(extractErrorMessage(err, 'Failed to delete certification.'));
      }
    }
    setIsSubmitting(false);
  };

  const handleAddNewClick = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCancelClick = () => {
    resetForm();
  };
  
  const formatDateForDisplay = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Add time zone offset to prevent date from shifting
      const offsetDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
      return offsetDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString; // fallback to original string if date is invalid
    }
  };


  return (
    <section id="certifications-section" className="py-8 mb-8 scroll-mt-20">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
        <Award className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" />
        Certifications
      </h2>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
        {!showForm && (
          <button
            onClick={handleAddNewClick}
            disabled={isSubmitting}
            className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center w-72 disabled:opacity-50"
          >
            <PlusCircle size={20} className="mr-2" />
            Add Certification
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700/50 shadow-md rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingCertification ? 'Edit Certification' : 'Add New Certification'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md text-sm flex items-center">
                <AlertCircle size={18} className="mr-2" />
                {error}
              </div>
            )}
            {successMessage && !error && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-800 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded-md text-sm flex items-center">
                <CheckCircle size={18} className="mr-2" />
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name*</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Certified Kubernetes Administrator"
                  required
                />
              </div>
              <div>
                <label htmlFor="issuing_organization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issuing Organization*</label>
                <input
                  type="text"
                  name="issuing_organization"
                  id="issuing_organization"
                  value={formData.issuing_organization}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., The Linux Foundation"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Date*</label>
                <input
                  type="date"
                  name="issue_date"
                  id="issue_date"
                  value={formData.issue_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="expiration_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration Date</label>
                <input
                  type="date"
                  name="expiration_date"
                  id="expiration_date"
                  value={formData.expiration_date || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="credential_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credential ID</label>
                <input
                  type="text"
                  name="credential_id"
                  id="credential_id"
                  value={formData.credential_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., LF-ABC123XYZ"
                />
              </div>
              <div>
                <label htmlFor="credential_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credential URL</label>
                <input
                  type="url"
                  name="credential_url"
                  id="credential_url"
                  value={formData.credential_url || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., https://example.com/credential/123"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center disabled:opacity-50"
              >
                <Save size={20} className="mr-2" />
                {editingCertification ? 'Save Changes' : 'Save Certification'}
              </button>
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={isSubmitting}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center disabled:opacity-50 ml-3"
              >
                <XCircle size={20} className="mr-2" />
                Cancel
              </button>
            </div>
          </form>
        )}

        {isLoading && <p className="text-gray-600 dark:text-gray-400">Loading certifications...</p>}
        
        {!isLoading && !showForm && certifications.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 italic text-left py-4">
            No certifications added yet. Click "Add Certification" to get started.
          </p>
        )}

        {!showForm && certifications.length > 0 && (
          <div className="space-y-6">
            {certifications.map((cert) => (
              <div key={cert.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-150">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">{cert.name}</h4>
                    <p className="text-md text-gray-700 dark:text-gray-300">{cert.issuing_organization}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Issued: {formatDateForDisplay(cert.issue_date)}
                      {cert.expiration_date && ` - Expires: ${formatDateForDisplay(cert.expiration_date)}`}
                    </p>
                    {cert.credential_id && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {cert.credential_id}
                      </p>
                    )}
                    {cert.credential_url && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        URL: <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline">Verify Credential</a>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(cert)}
                      disabled={isSubmitting}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
                      title="Edit Certification"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(cert.id)}
                      disabled={isSubmitting}
                      className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete Certification"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CertificationsSection;