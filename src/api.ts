// const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// // 🧵 CREATE JOB
// export const createJob = async (job: any) => {
//   const res = await fetch(`${API}/jobs`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(job),
//   });

//   if (!res.ok) throw new Error("Failed to create job");
// };

// // 📥 GET JOBS
// export const getJobs = async () => {
//   const res = await fetch(`${API}/jobs`);

//   if (!res.ok) throw new Error("Failed to fetch jobs");

//   return res.json();
// };

// // 🔄 UPDATE JOB
// export const updateJob = async (
//   id: string,
//   status: string,
//   tailor: string,
//   priority: string,
// ) => {
//   const res = await fetch(`${API}/jobs/update`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ id, status, tailor, priority }),
//   });

//   if (!res.ok) throw new Error("Failed to update job");
// };

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

// 🧵 CREATE JOB
export const createJob = async (job: any) => {
  const res = await fetch(`${API}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(job),
  });

  if (!res.ok) throw new Error("Failed to create job");
};

// 📥 GET JOBS
export const getJobs = async () => {
  const res = await fetch(`${API}/jobs`);

  if (!res.ok) throw new Error("Failed to fetch jobs");

  return res.json();
};

// 🔄 UPDATE JOB
export const updateJob = async (
  id: string,
  status: string,
  tailor: string,
  priority: string,
) => {
  const res = await fetch(`${API}/jobs/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status, tailor, priority }),
  });

  if (!res.ok) throw new Error("Failed to update job");
};

export const API_URL = import.meta.env.VITE_API_URL;

export const safeFetch = async (url: string, options?: any) => {
  try {
    const res = await fetch(`${API_URL}${url}`, options);

    const text = await res.text(); // 🔥 handle HTML also

    try {
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    } catch {
      throw new Error("Server error (non-JSON response)");
    }
  } catch (err: any) {
    console.error("API ERROR:", err);
    throw err;
  }
};
