import axios from "axios";

export default axios.create({
  baseURL: "http://localhost:8080/api",
  params: { key: "be1522d46ffc4a73bcbcc26ea1742304" },
});
