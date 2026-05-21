"""full_schema_v2 - add all new tables and columns

Revision ID: 001_full_schema_v2
Revises: 03f29471eb7a
Create Date: 2026-05-20
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_full_schema_v2'
down_revision: Union[str, None] = '03f29471eb7a'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add new columns to users table
    op.add_column('users', sa.Column('full_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('is_approved', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.String(), nullable=True))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Expand student_profiles table
    op.add_column('student_profiles', sa.Column('full_name', sa.String(), nullable=True))
    op.add_column('student_profiles', sa.Column('prn', sa.String(), nullable=True))
    op.add_column('student_profiles', sa.Column('photo_url', sa.String(), nullable=True))
    op.add_column('student_profiles', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('student_profiles', sa.Column('year_of_study', sa.Integer(), nullable=True))
    op.add_column('student_profiles', sa.Column('section', sa.String(), nullable=True))
    op.add_column('student_profiles', sa.Column('num_backlogs', sa.Integer(), server_default='0', nullable=True))
    op.add_column('student_profiles', sa.Column('github_url', sa.String(), nullable=True))
    op.add_column('student_profiles', sa.Column('linkedin_url', sa.String(), nullable=True))
    op.add_column('student_profiles', sa.Column('portfolio_url', sa.String(), nullable=True))
    op.add_column('student_profiles', sa.Column('placement_status', sa.String(), server_default='NOT_PLACED', nullable=True))
    op.add_column('student_profiles', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Create certifications table
    op.create_table('certifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('issuer', sa.String(), nullable=True),
        sa.Column('issue_date', sa.String(), nullable=True),
        sa.Column('credential_url', sa.String(), nullable=True),
        sa.Column('certificate_file_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['student_id'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['colleges.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_certifications_student_id', 'certifications', ['student_id'])
    
    # Create hackathons table
    op.create_table('hackathons',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_name', sa.String(), nullable=False),
        sa.Column('position', sa.String(), nullable=True),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('proof_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['student_id'], ['users.id']),
        sa.ForeignKeyConstraint(['tenant_id'], ['colleges.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create interview_sessions table
    op.create_table('interview_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('round_type', sa.String(), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('transcript', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['student_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create syllabi table
    op.create_table('syllabi',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('branch', sa.String(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('subjects', postgresql.JSONB(), nullable=True),
        sa.Column('pdf_file_id', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['colleges.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create announcements table
    op.create_table('announcements',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sender_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sender_role', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('audience_filter', postgresql.JSONB(), nullable=True),
        sa.Column('send_at', sa.DateTime(), nullable=True),
        sa.Column('sent_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['colleges.id']),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create company_profiles table
    op.create_table('company_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('logo_url', sa.String(), nullable=True),
        sa.Column('industry', sa.String(), nullable=True),
        sa.Column('website', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('size', sa.String(), nullable=True),
        sa.Column('hq_location', sa.String(), nullable=True),
        sa.Column('founded_year', sa.Integer(), nullable=True),
        sa.Column('perks', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    
    # Expand job_postings table
    op.add_column('job_postings', sa.Column('location', sa.String(), nullable=True))
    op.add_column('job_postings', sa.Column('role_type', sa.String(), server_default='FTE', nullable=True))  # INTERN or FTE
    op.add_column('job_postings', sa.Column('required_skills', sa.ARRAY(sa.String()), nullable=True))
    op.add_column('job_postings', sa.Column('min_year', sa.Integer(), nullable=True))
    op.add_column('job_postings', sa.Column('max_backlogs', sa.Integer(), server_default='0', nullable=True))
    op.add_column('job_postings', sa.Column('joining_date', sa.String(), nullable=True))
    op.add_column('job_postings', sa.Column('is_published', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('job_postings', sa.Column('created_at', sa.DateTime(), nullable=True))

def downgrade() -> None:
    # Drop new tables
    op.drop_table('company_profiles')
    op.drop_table('announcements')
    op.drop_table('syllabi')
    op.drop_table('interview_sessions')
    op.drop_table('hackathons')
    op.drop_index('ix_certifications_student_id', 'certifications')
    op.drop_table('certifications')
    # Remove added columns (abbreviated)
    op.drop_column('job_postings', 'is_published')
    op.drop_column('job_postings', 'joining_date')
    op.drop_column('job_postings', 'required_skills')
    op.drop_column('job_postings', 'role_type')
    op.drop_column('job_postings', 'location')
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'google_id')
    op.drop_column('users', 'is_approved')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'full_name')
