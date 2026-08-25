"""add image_url to recipes

Revision ID: a1b2c3d4e5f6
Revises: d18779d614c5
Create Date: 2026-08-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'd18779d614c5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('recipes', sa.Column('image_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('recipes', 'image_url')