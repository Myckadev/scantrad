import { Link } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Box, Button, IconButton, Menu, MenuItem, Avatar, useTheme
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TranslateIcon from "@mui/icons-material/Translate";
import { useState } from "react";
import LoginForm from "../../features/auth/LoginForm";
import {useAuth} from "../hooks/useAuth";

export function Navbar() {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openLogin, setOpenLogin] = useState(false);
  const { pseudo, isAuthenticated, logout } = useAuth();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <AppBar position="sticky" elevation={6}>
        <Toolbar
          sx={{
            minHeight: 72,
            px: { xs: 2, sm: 4 },
            backdropFilter: "blur(7px)",
            WebkitBackdropFilter: "blur(7px)",
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            component={Link}
            to="/"
            sx={{ mr: 1, fontSize: 28 }}
          >
            <MenuBookIcon sx={{ fontSize: 36, color: theme.palette.secondary.main }} />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              color: "white",
              letterSpacing: ".10em",
              textShadow: "0 2px 10px rgba(236,64,122,.16)",
              textDecoration: "none",
              flexGrow: 1,
            }}
          >
            ScanManga&nbsp;
            <span style={{ color: theme.palette.secondary.main, fontWeight: 700 }}>
              Traduction
            </span>
          </Typography>
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
            <Button variant="text" component={Link} to="/" color="inherit">Accueil</Button>
            <Button variant="text" component={Link} to="/projects" color="inherit">Projets</Button>
          </Box>

          <IconButton sx={{ ml: 1 }} color="inherit"><TranslateIcon /></IconButton>

          <Box ml={2}>
            {isAuthenticated ? (
              <>
                <IconButton onClick={handleMenu} size="large" color="inherit">
                  <Avatar src="/avatar-placeholder.png" sx={{ width: 36, height: 36, border: `2px solid ${theme.palette.secondary.main}` }}>
                    {pseudo?.[0]?.toUpperCase() ?? ""}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                >
                  <MenuItem disabled>{pseudo}</MenuItem>
                  <MenuItem onClick={() => { logout(); handleClose(); }}>Déconnexion</MenuItem>
                </Menu>
              </>
            ) : (
              <Button color="secondary" variant="contained" onClick={() => setOpenLogin(true)}>
                Connexion
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <LoginForm open={openLogin} onClose={() => setOpenLogin(false)} />
    </>
  );
}