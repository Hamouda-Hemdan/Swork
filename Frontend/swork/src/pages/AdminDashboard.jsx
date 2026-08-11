import { useState, useEffect } from "react";
import axios from "axios";
import { getPendingVerifications, approveRequest, rejectRequest, getApprovedVerifications, getRejectedVerifications, rejectRequestWithMessage } from "../api/auth";
import { FaUserCheck, FaUserClock, FaUserTimes, FaCheck, FaTimes, FaSearch, FaFilter, FaDownload, FaEye } from "react-icons/fa";
import DocumentViewerModal from "../components/DocumentViewerModal";

const AdminDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [currentView, setCurrentView] = useState("pending"); // pending, approved, rejected
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState({ id: null, name: "" });
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [currentRejectionId, setCurrentRejectionId] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch all types of requests
      const [pending, approved, rejected] = await Promise.all([
        getPendingVerifications(),
        getApprovedVerifications(),
        getRejectedVerifications()
      ]);
      
      setPendingRequests(pending);
      setApprovedRequests(approved);
      setRejectedRequests(rejected);
      
      setError("");
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      setError("Failed to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchData = async () => {
    try {
      setLoading(true);
      if (currentView === "pending") {
        const requests = await getPendingVerifications();
        setPendingRequests(requests);
      } else if (currentView === "approved") {
        const requests = await getApprovedVerifications();
        setApprovedRequests(requests);
      } else if (currentView === "rejected") {
        const requests = await getRejectedVerifications();
        setRejectedRequests(requests);
      }
      setError("");
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      setError("Failed to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentView]);

  const handleApprove = async (requestId) => {
    try {
      await approveRequest(requestId);
      // Refresh the list after approval
      fetchData();
    } catch (err) {
      console.error("Failed to approve request:", err);
      setError("Failed to approve request. Please try again.");
    }
  };

  const handleRejectionModalOpen = (requestId) => {
    setCurrentRejectionId(requestId);
    setRejectionMessage("");
    setIsRejectionModalOpen(true);
  };

  const handleRejectionModalClose = () => {
    setIsRejectionModalOpen(false);
    setCurrentRejectionId(null);
    setRejectionMessage("");
  };

  const handleRejectWithMessage = async () => {
    if (!rejectionMessage.trim()) {
      setError("Please enter a rejection message.");
      return;
    }
    
    try {
      await rejectRequestWithMessage(currentRejectionId, rejectionMessage);
      handleRejectionModalClose();
      // Refresh the list after rejection
      fetchData();
    } catch (err) {
      console.error("Failed to reject request:", err);
      setError("Failed to reject request. Please try again.");
    }
  };

  const fetchDocument = async (requestId) => {
    try {
      // Create a temporary API client for file download with appropriate response type
      const downloadClient = axios.create({
        baseURL: "https://localhost:7139/api",
        responseType: 'blob',
        timeout: 30000,
        httpsAgent: {
          rejectUnauthorized: false,
        },
      });

      // Add authorization header
      const token = localStorage.getItem("token");
      if (token) {
        downloadClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      const response = await downloadClient.get(`/FreelancerVerification/documents/${requestId}`);
      return response.data; // Return the blob directly
    } catch (err) {
      console.error("Failed to fetch document:", err);
      setError("Failed to fetch document. Please try again.");
      throw err;
    }
  };

  const openDocumentModal = (requestId, fileName) => {
    setSelectedDocument({ id: requestId, name: fileName });
    setIsDocumentModalOpen(true);
  };

  const closeDocumentModal = () => {
    setIsDocumentModalOpen(false);
    setSelectedDocument({ id: null, name: "" });
  };

  // Get the current requests based on the view
  const getCurrentRequests = () => {
    if (currentView === "pending") return pendingRequests;
    if (currentView === "approved") return approvedRequests;
    if (currentView === "rejected") return rejectedRequests;
    return [];
  };

  const allRequests = getCurrentRequests();

  const filteredRequests = allRequests.filter(request => {
    const matchesSearch = (request.userName && request.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (request.userEmail && request.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (request.universityName && request.universityName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (request.department && request.department.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage freelancer verification requests</p>
          </div>

          {/* View Toggle Buttons */}
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => setCurrentView("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentView === "pending"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Pending ({pendingRequests.length})
            </button>
            <button
              onClick={() => setCurrentView("approved")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentView === "approved"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Approved ({approvedRequests.length})
            </button>
            <button
              onClick={() => setCurrentView("rejected")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentView === "rejected"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Rejected ({rejectedRequests.length})
            </button>
          </div>

          {/* Stats Cards - Only show pending count */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FaUserClock className="text-orange-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current View: {currentView.charAt(0).toUpperCase() + currentView.slice(1)}</p>
                  <p className="text-2xl font-semibold text-gray-900">{filteredRequests.length} {currentView.charAt(0).toUpperCase() + currentView.slice(1)} Requests</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or university..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

            </div>
          </div>

          {/* Requests List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)} Verification Requests
              </h2>
            </div>
            
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FaUserClock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No {currentView} verification requests found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{request.userName}</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="font-medium">Email</p>
                            <p>{request.userEmail}</p>
                          </div>
                          <div>
                            <p className="font-medium">University</p>
                            <p>{request.universityName || "Not provided"}</p>
                          </div>
                          <div>
                            <p className="font-medium">Graduation Year</p>
                            <p>{request.year || "Not provided"}</p>
                          </div>
                          <div>
                            <p className="font-medium">Department</p>
                            <p>{request.department || "Not provided"}</p>
                          </div>
                          <div>
                            <p className="font-medium">Phone</p>
                            <p>{request.phone || "Not provided"}</p>
                          </div>
                          <div>
                            <p className="font-medium">Freelancer Phone</p>
                            <p>{request.freelancerPhone || "Not provided"}</p>
                          </div>
                        </div>
                        
                        {/* Show rejection reason if request is rejected */}
                        {request.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg">
                            <p className="font-medium text-red-800">Rejection Reason:</p>
                            <p className="text-red-700">{request.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 md:flex-col lg:flex-row">
                        {currentView === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                            >
                              <FaCheck />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectionModalOpen(request.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                            >
                              <FaTimes />
                              Reject with Message
                            </button>
                          </>
                        )}
                        {(currentView === "approved" || currentView === "rejected") && (
                          <button
                            onClick={() => openDocumentModal(request.id, request.documentFileName || 'Verification Document')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                          >
                            <FaEye />
                            View Document
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {(request.documentFileName || request.documentPath) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Document:</p>
                        <button
                          onClick={() => openDocumentModal(request.id, request.documentFileName || 'Verification Document')}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          <FaDownload />
                          View Document ({request.documentFileName || 'Verification Document'})
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isDocumentModalOpen && (
        <DocumentViewerModal
          isOpen={isDocumentModalOpen}
          onClose={closeDocumentModal}
          documentId={selectedDocument.id}
          fileName={selectedDocument.name}
          fetchDocument={fetchDocument}
        />
      )}
      
      {/* Rejection Modal */}
      {isRejectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Request</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
            
            <textarea
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
            
            {error && (
              <div className="mt-2 text-red-600 text-sm">{error}</div>
            )}
            
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleRejectionModalClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectWithMessage}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;