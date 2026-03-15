# Re-export from france_travail client — LBB uses the same OAuth token endpoint
from app.clients.france_travail import fetch_lbb_companies

__all__ = ["fetch_lbb_companies"]
