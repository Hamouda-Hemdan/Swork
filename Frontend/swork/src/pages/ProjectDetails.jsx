import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import {
  completeMockProjectPayment,
  getCurrentUserId,
  getCurrentUserRole,
  getProjectById,
  getProjectMessages,
  HUB_BASE_URL,
  sendProjectMessage,
  setProjectDeadline,
  startMockProjectPayment,
  updateProjectStatus,
  upsertProjectReview,
} from "../api/auth";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaComments,
  FaPaperPlane,
  FaRegClock,
} from "react-icons/fa";

const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status.replace(/([a-z])([A-Z])/g, "$1 $2");
};

const workflowSteps = [
  { id: "InProgress", label: "Submitted" },
  { id: "ChangesRequestedByClient", label: "Changes Requested" },
  { id: "DoneByFreelancer", label: "Done" },
  { id: "ApprovedByClient", label: "Approved" },
  { id: "PaymentReceived", label: "Payment Received" },
];

const statusStyles = {
  InProgress: "bg-sky-100 text-sky-800",
  DoneByFreelancer: "bg-amber-100 text-amber-800",
  ChangesRequestedByClient: "bg-rose-100 text-rose-800",
  ApprovedByClient: "bg-green-100 text-green-800",
  OnHold: "bg-zinc-100 text-zinc-800",
  Cancelled: "bg-red-100 text-red-800",
};

const toLocalInputValue = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const pad = (value) => String(value).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ProjectDetails = () => {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const [reviewForm, setReviewForm] = useState({ rating: "5", feedback: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [deadlineValue, setDeadlineValue] = useState("");
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [changeRequestComment, setChangeRequestComment] = useState("");

  const projectIdRef = useRef(null);

  const userRole = getCurrentUserRole();
  const currentUserId = getCurrentUserId();

  const canManageAsClientOrAdmin = useMemo(() => {
    if (!project) return false;
    return (
      userRole === "Admin" ||
      (userRole === "Client" && project.clientUserId === currentUserId)
    );
  }, [project, userRole, currentUserId]);

  const canMarkDoneAsFreelancer = useMemo(() => {
    if (!project) return false;
    return (
      userRole === "Freelancer" &&
      project.freelancerUserId === currentUserId &&
      (project.statusName === "InProgress" ||
        project.statusName === "ChangesRequestedByClient")
    );
  }, [project, userRole, currentUserId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getProjectById(id);
      setProject(data);
      setDeadlineValue(toLocalInputValue(data.deadlineAt));
    } catch (err) {
      console.error("Failed to load project:", err);
      setError(
        err.response?.data?.message || "Failed to load project details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    const comment = changeRequestComment.trim();
    if (!comment) {
      setError("Please add a comment describing what should be changed.");
      return;
    }

    await handleStatusChange("ChangesRequestedByClient", comment);
    setChangeRequestComment("");
    await loadMessages();
  };

  const loadMessages = async () => {
    try {
      setMessagesLoading(true);
      const data = await getProjectMessages(id);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError(err.response?.data?.message || "Failed to load chat messages.");
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    projectIdRef.current = Number(id);
    loadProject();
    loadMessages();
  }, [id]);

  useEffect(() => {
    let isUnmounted = false;
    let connectionRef = null;

    const initConnection = async () => {
      try {
        const connection = new HubConnectionBuilder()
          .withUrl(`${HUB_BASE_URL}/hubs/project-chat`, {
            accessTokenFactory: () => localStorage.getItem("token") || "",
          })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Warning)
          .build();

        connectionRef = connection;

        connection.on("projectMessageCreated", (message) => {
          if (message.projectId !== Number(id)) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) {
              return prev;
            }
            return [...prev, message];
          });
        });

        connection.onreconnected(async () => {
          const activeProjectId = projectIdRef.current;
          if (!activeProjectId) return;
          try {
            await connection.invoke("JoinProjectGroup", activeProjectId);
          } catch (joinErr) {
            console.error("Failed to rejoin project chat group:", joinErr);
          }
        });

        await connection.start();

        if (!isUnmounted) {
          await connection.invoke("JoinProjectGroup", Number(id));
        } else {
          await connection.stop();
        }
      } catch (err) {
        const errorMessage = err?.message || "";
        const isExpectedAbort =
          err?.name === "AbortError" ||
          errorMessage.includes("stopped during negotiation");

        if (!isUnmounted && !isExpectedAbort) {
          console.error("Failed to connect to project chat hub:", err);
        }
      }
    };

    initConnection();

    return () => {
      isUnmounted = true;
      if (connectionRef) {
        connectionRef.invoke("LeaveProjectGroup", Number(id)).catch(() => {});
        connectionRef.stop();
      }
    };
  }, [id]);

  useEffect(() => {
    if (!project?.review) {
      setReviewForm({ rating: "5", feedback: "" });
      return;
    }

    setReviewForm({
      rating: String(project.review.rating),
      feedback: project.review.feedback || "",
    });
  }, [project?.id, project?.review]);

  const handleStatusChange = async (status, comment = null) => {
    try {
      setError("");
      setSuccess("");
      const updated = await updateProjectStatus(id, status, comment);
      setProject(updated);
      setSuccess(
        `Project status updated to ${formatStatus(updated.statusName)}.`,
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(
        err.response?.data?.message || "Failed to update project status.",
      );
    }
  };

  const handleSetDeadline = async () => {
    if (!deadlineValue) {
      setError("Please choose a deadline.");
      return;
    }

    try {
      setSavingDeadline(true);
      setError("");
      setSuccess("");
      const updated = await setProjectDeadline(
        id,
        new Date(deadlineValue).toISOString(),
      );
      setProject(updated);
      setSuccess("Deadline updated.");
    } catch (err) {
      console.error("Failed to set deadline:", err);
      setError(err.response?.data?.message || "Failed to set deadline.");
    } finally {
      setSavingDeadline(false);
    }
  };

  const handleOpenMockCheckout = async () => {
    try {
      setError("");
      setSuccess("");
      const result = await startMockProjectPayment(id);
      window.open(
        `${window.location.origin}${result.checkoutUrl}`,
        "_blank",
        "noopener,noreferrer",
      );
      setSuccess("Mock checkout opened in a new tab.");
    } catch (err) {
      console.error("Failed to open checkout:", err);
      setError(err.response?.data?.message || "Failed to open checkout.");
    }
  };

  const handleCompletePayment = async () => {
    try {
      setError("");
      setSuccess("");
      await completeMockProjectPayment(id);
      await loadProject();
      setSuccess("Payment funded successfully.");
    } catch (err) {
      console.error("Failed to complete payment:", err);
      setError(err.response?.data?.message || "Failed to complete payment.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const created = await sendProjectMessage(id, newMessage.trim());
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) {
          return prev;
        }
        return [...prev, created];
      });
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmittingReview(true);
      setError("");
      setSuccess("");
      const updated = await upsertProjectReview(id, {
        rating: Number(reviewForm.rating),
        feedback: reviewForm.feedback.trim() || null,
      });
      setProject(updated);
      setSuccess("Review saved.");
    } catch (err) {
      console.error("Failed to save review:", err);
      setError(err.response?.data?.message || "Failed to save review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100 px-4 py-12 flex items-center justify-center">
        <p className="text-gray-600">Loading project details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-orange-700 font-semibold hover:text-orange-800"
          >
            <FaArrowLeft />
            Back to Projects
          </Link>
          <button
            onClick={() => setChatOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 font-semibold"
          >
            <FaComments />
            Open Chat
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4">
            {success}
          </div>
        )}

        <section className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {project.title}
              </h1>
              <p className="text-gray-600 mt-2">{project.description}</p>
              <p className="text-sm text-gray-500 mt-3">
                Client: {project.clientName} • Freelancer:{" "}
                {project.freelancerName}
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusStyles[project.statusName] || "bg-gray-100 text-gray-700"}`}
            >
              {formatStatus(project.statusName)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50">
              <p className="text-xs text-gray-500 uppercase">Payment</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                ${Number(project.paymentAmount || 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Fund status: {project.mockPaymentStatus || "Pending"}
              </p>
              <p className="text-sm text-gray-600">
                Release: {project.paymentReleaseStatus || "Pending"}
              </p>
              {project.mockPaymentFundedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Funded at{" "}
                  {new Date(project.mockPaymentFundedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50">
              <p className="text-xs text-gray-500 uppercase">Deadline</p>
              <p className="text-sm text-gray-700 mt-2 inline-flex items-center gap-2">
                <FaRegClock className="text-orange-500" />
                {project.deadlineAt
                  ? new Date(project.deadlineAt).toLocaleString()
                  : "Not set yet"}
              </p>
              {canManageAsClientOrAdmin && (
                <div className="mt-3 space-y-2">
                  <input
                    type="datetime-local"
                    value={deadlineValue}
                    onChange={(e) => setDeadlineValue(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  />
                  <button
                    onClick={handleSetDeadline}
                    disabled={savingDeadline}
                    className="w-full rounded-xl bg-gray-900 hover:bg-black text-white px-3 py-2 text-sm disabled:opacity-60"
                  >
                    {savingDeadline ? "Saving..." : "Set Deadline"}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50">
              <p className="text-xs text-gray-500 uppercase">Actions</p>
              <div className="mt-3 flex flex-col gap-2">
                {canManageAsClientOrAdmin && (
                  <>
                    <button
                      onClick={handleOpenMockCheckout}
                      className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 text-sm"
                    >
                      Open Payment Checkout
                    </button>
                    <button
                      onClick={handleCompletePayment}
                      disabled={project.isMockPaymentFunded}
                      className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm disabled:bg-gray-300"
                    >
                      Mark Payment Funded
                    </button>
                    <textarea
                      value={changeRequestComment}
                      onChange={(e) => setChangeRequestComment(e.target.value)}
                      rows={2}
                      maxLength={2000}
                      placeholder="Write what should be changed..."
                      className="rounded-xl border border-rose-200 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleRequestChanges}
                      disabled={project.statusName !== "DoneByFreelancer"}
                      className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 text-sm disabled:bg-gray-300"
                    >
                      Request Changes with Comment
                    </button>
                    <button
                      onClick={() => handleStatusChange("ApprovedByClient")}
                      disabled={project.statusName !== "DoneByFreelancer"}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm disabled:bg-gray-300"
                    >
                      Approve Project
                    </button>
                  </>
                )}

                {canMarkDoneAsFreelancer && (
                  <button
                    onClick={() => handleStatusChange("DoneByFreelancer")}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-sm"
                  >
                    Mark Work as Done
                  </button>
                )}

                {project.paymentReleaseStatus === "Received" && (
                  <p className="text-sm text-green-700 inline-flex items-center gap-2 font-semibold mt-1">
                    <FaCheckCircle />
                    Payment received
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Project Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {workflowSteps.map((step) => {
              const active =
                step.id === project.statusName ||
                (step.id === "PaymentReceived" &&
                  project.paymentReleaseStatus === "Received");

              const completed =
                (step.id === "InProgress" &&
                  project.statusName !== "Cancelled") ||
                (step.id === "DoneByFreelancer" &&
                  ["DoneByFreelancer", "ApprovedByClient"].includes(
                    project.statusName,
                  )) ||
                (step.id === "ApprovedByClient" &&
                  project.statusName === "ApprovedByClient") ||
                (step.id === "PaymentReceived" &&
                  project.paymentReleaseStatus === "Received") ||
                (step.id === "ChangesRequestedByClient" &&
                  project.statusName === "ChangesRequestedByClient");

              return (
                <div
                  key={step.id}
                  className={`rounded-2xl border px-3 py-4 text-center ${
                    active
                      ? "border-orange-400 bg-orange-50"
                      : completed
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Step
                  </p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {(userRole === "Client" || userRole === "Admin") &&
          project.statusName === "ApprovedByClient" && (
            <section className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Rate Freelancer
              </h3>
              <form
                onSubmit={handleReviewSubmit}
                className="grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                <select
                  value={reviewForm.rating}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      rating: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-gray-200 px-3 py-2.5"
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Very Poor</option>
                </select>
                <textarea
                  value={reviewForm.feedback}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      feedback: e.target.value,
                    }))
                  }
                  rows={3}
                  className="md:col-span-2 rounded-xl border border-gray-200 px-3 py-2.5"
                  placeholder="Share your feedback"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="md:col-span-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 disabled:opacity-60"
                >
                  {submittingReview
                    ? "Saving..."
                    : project.review
                      ? "Update Review"
                      : "Submit Review"}
                </button>
              </form>
            </section>
          )}
      </div>

      {chatOpen && (
        <div className="fixed inset-0 bg-black/35 z-50 flex items-end md:items-center justify-center p-3 md:p-6">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 inline-flex items-center gap-2">
                <FaComments className="text-orange-600" />
                Project Chat
              </h3>
              <button
                onClick={() => setChatOpen(false)}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <div className="p-4 h-80 overflow-y-auto bg-gray-50 space-y-3">
              {messagesLoading ? (
                <p className="text-sm text-gray-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet.</p>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderUserId === currentUserId;
                  return (
                    <div
                      key={`${message.id}-${message.sentAt}`}
                      className={`max-w-[82%] p-3 rounded-xl ${
                        isMine
                          ? "ml-auto bg-orange-100 text-orange-900"
                          : "mr-auto bg-white border border-gray-200 text-gray-800"
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1">
                        {message.senderName} ({message.senderRole})
                      </p>
                      <p className="text-sm whitespace-pre-line">
                        {message.message}
                      </p>
                      <p className="text-[11px] opacity-70 mt-1">
                        {new Date(message.sentAt).toLocaleString()}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-gray-100 flex items-center gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white px-4 py-3 rounded-xl font-semibold"
              >
                <FaPaperPlane />
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
