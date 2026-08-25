"""add user_id to shopping_list_items

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('shopping_list_items', sa.Column('user_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_shopping_list_items_user_id'), 'shopping_list_items', ['user_id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_shopping_list_items_user_id'), table_name='shopping_list_items')
    op.drop_column('shopping_list_items', 'user_id')
