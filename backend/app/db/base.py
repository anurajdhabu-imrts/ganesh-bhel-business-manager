"""Declarative base for all ORM models.

Importing `Base` here and the models package ensures every model is registered
on the metadata, which Alembic autogeneration relies on.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
