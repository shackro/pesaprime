import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import {
  getInvestments,
  createInvestment,
  deleteInvestment,
} from "../services/investmentsService";

// Types for an investment item returned from API
interface Investment {
  id: number;
  user_id: string;
  title: string;
  amount: number;
  category: string;
}

// Form structure
interface InvestmentForm {
  user_id: string;
  title: string;
  amount: string; // keep as string for inputs
  category: string;
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [form, setForm] = useState<InvestmentForm>({
    user_id: "",
    title: "",
    amount: "",
    category: "general",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const data = await getInvestments();
    setInvestments(data);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await createInvestment({
      ...form,
      amount: Number(form.amount),
    });

    fetchAll();
  };

  const handleDelete = async (id: number) => {
    await deleteInvestment(id);
    fetchAll();
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Investments</h2>

      {/* FORM */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          name="user_id"
          placeholder="User ID"
          value={form.user_id}
          onChange={handleChange}
        />

        <input
          type="text"
          name="title"
          placeholder="Investment Title"
          value={form.title}
          onChange={handleChange}
        />

        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
        />

        <button type="submit">Create Investment</button>
      </form>

      {/* LIST */}
      <ul>
        {investments.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong> — ${item.amount}
            <button
              onClick={() => handleDelete(item.id)}
              style={{ marginLeft: "10px" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
