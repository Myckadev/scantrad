import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert } from "@mui/material";
import {useLoginMutation} from "../../app/services/authService";
import {useAuth} from "../../app/hooks/useAuth";

interface LoginFormProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginForm({ open, onClose }: LoginFormProps) {
  const [inputPseudo, setInputPseudo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loginApi, { isLoading }] = useLoginMutation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await loginApi({ pseudo: inputPseudo }).unwrap();
      login(response.pseudo);
      onClose();
      setInputPseudo("");
    } catch (err: any) {
      setError(err?.data?.detail ?? "Erreur lors de la connexion.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Connexion</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Pseudo"
            value={inputPseudo}
            onChange={(e) => setInputPseudo(e.target.value)}
            required
            disabled={isLoading}
            margin="normal"
            autoComplete="off"
          />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Annuler</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? "Connexion..." : "Connexion"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}