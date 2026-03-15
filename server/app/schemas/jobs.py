from pydantic import BaseModel


class JobListing(BaseModel):
    title: str
    company: str
    location: str
    url: str
    source: str
    published_at: str
    salary: str | None = None


class LBBCompany(BaseModel):
    name: str
    siret: str
    naf_text: str
    city: str
    zipcode: str
    stars: float
    headcount_text: str
    url: str
