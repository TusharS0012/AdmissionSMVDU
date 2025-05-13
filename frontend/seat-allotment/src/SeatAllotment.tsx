import React, { useEffect, useState } from "react";

interface SeatAllotmentData {
  candidateName: string;
  seatNumber: string;
  course: string;
  round: string;
}

const SeatAllotment = () => {
  const [allotment, setAllotment] = useState<SeatAllotmentData | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchAllotment = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not authenticated.");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/api/seat-allotment", { // deployment mei replace with your backend url
          method: "POST",  
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,   
          },
        });

        if (response.ok) {
          const data: SeatAllotmentData = await response.json();
          setAllotment(data);
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to fetch allotment data.");
        }
      } catch (err) {
        setError("An error occurred while fetching the seat allotment.");
        console.error(err);
      }
    };

    fetchAllotment();
  }, []);

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!allotment) {
    return <p>Loading seat allotment...</p>;
  }

  return (
    <div>
      <h2>Seat Allotment</h2>
      <p>Candidate Name: {allotment.candidateName}</p>
      <p>Seat Number: {allotment.seatNumber}</p>
      <p>Allocated Course: {allotment.course}</p>
      <p>Round: {allotment.round}</p>
    </div>
  );
};

export default SeatAllotment;
