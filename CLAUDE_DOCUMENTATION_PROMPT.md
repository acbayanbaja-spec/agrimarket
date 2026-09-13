# Claude AI Prompt for System Documentation Generation

## Purpose
This prompt guides Claude to generate complete, professional DATABASE SYSTEM DOCUMENTATION that matches the exact format, structure, and depth of your reference document while accurately reflecting your specific system requirements.

---

## The Complete Prompt to Use with Claude

```
You are an expert database systems documentation specialist. Your task is to create comprehensive DATABASE SYSTEM DOCUMENTATION for an agricultural marketplace platform.

IMPORTANT: Use EXACTLY this structure and format, matching the reference document provided. Do NOT deviate from this format.

## CRITICAL INSTRUCTIONS:

1. SYSTEM IDENTIFICATION
   - System Name: Agricultural Marketplace Management System (AMMS)
   - Primary Purpose: A relational database system for managing agricultural products, farmers, buyers, orders, inventory, quality control, and transactions
   - Industry: Agriculture/Agribusiness
   - Type: B2B/B2C Agricultural E-Commerce Platform

2. STRUCTURE REQUIREMENTS
   Your documentation MUST include exactly these chapters:
   
   CHAPTER I: SYSTEM OVERVIEW AND SCOPE
   - 1.1 Executive Summary and Business Problem Definition
   - 1.2 Scope and System Boundaries (with 1.2.1, 1.2.2, 1.2.3 subsections)
   - 1.3 Technical Environment Specifications
   - 1.4 Actor and User Role Analysis

   CHAPTER II: REQUIREMENTS AND DOMAIN ANALYSIS
   - 2.1 Functional and Non-Functional Requirements
   - 2.2 Business Rules and Integrity Constraints
   - 2.3 Comprehensive Data Dictionary

   CHAPTER III: DATA MODELING AND ARCHITECTURAL DESIGN
   - 3.1 Conceptual Data Model
   - 3.2 Logical Schema Design
   - 3.3 Physical Database Design
   - 3.4 Normalization Analysis and Proof
   - 3.5 Functional Dependency Analysis
   - 3.6 Denormalization Considerations

   CHAPTER IV: MYSQL IMPLEMENTATION AND SCHEMA DEFINITION
   - 4.1 Database and Table Creation
   - 4.2 Data Definition Language
   - 4.3 Constraints and Referential Integrity
   - 4.4 Indexing Strategy and Optimization
   - 4.5 Views
   - 4.6 Stored Procedures
   - 4.7 Functions
   - 4.8 Triggers

   CHAPTER V: PERFORMANCE OPTIMIZATION AND TRANSACTION MANAGEMENT
   - 5.1 Query Workload and Execution Plan Analysis
   - 5.2 Query Optimization
   - 5.3 Transaction Management
   - 5.4 Concurrency Control

   CONCLUSION

3. CONTENT DEPTH REQUIREMENTS FOR EACH SECTION

   CHAPTER I: SYSTEM OVERVIEW
   
   1.1 Executive Summary (500-800 words)
   - Start with system name and core purpose
   - Describe the business problem the system solves
   - Explain the challenges in agricultural product management
   - Describe how a relational database solves these problems
   - State the main purpose in data management context
   - Include 8-10 major objectives numbered and detailed
   - End with overall system vision statement
   
   1.2 Scope and System Boundaries
   1.2.1 Functions Included (should list 12-15 key functions with bullet points)
   1.2.2 Functions Outside Database Scope (list UI, external integrations)
   1.2.3 System Boundary (describe three-layer architecture: Presentation → Application → Database)
   
   1.3 Technical Environment (create a specifications table with these rows):
   - Database Management System
   - Storage Engine
   - Character Set
   - Collation
   - Development Environment
   - Database Administration Tools
   - Application Layer
   - Query Language
   - Operating System
   - Development IDE
   Then explain the technical choices made.
   
   1.4 Actor and User Role Analysis
   - Define each user role (Administrator, Farmer/Supplier, Quality Control, Inventory Manager, Delivery/Logistics, Buyer/Customer)
   - For each role, list 5-7 typical responsibilities as bullet points

   ---

   CHAPTER II: REQUIREMENTS AND DOMAIN ANALYSIS
   
   2.1 Functional and Non-Functional Requirements
   2.1.1 Functional Requirements (list as FR-01 through FR-12)
   2.1.2 Non-Functional Requirements (Performance, Reliability, Security, Scalability, Maintainability, Availability)
   
   2.2 Business Rules and Integrity Constraints
   - List 10 business rules numbered and named
   - Explain how each rule is implemented in the database
   - Show example SQL constraint
   
   2.3 Comprehensive Data Dictionary
   - Create tables for each entity showing:
     * Field name
     * Data Type
     * Key type (PK, FK, UQ)
     * Description
   - Include: Farmers, Products, Categories, Inventory, Orders, Order Items, Payments, Deliveries, Quality Control, Buyers

   ---

   CHAPTER III: DATA MODELING AND ARCHITECTURAL DESIGN
   
   3.1 Conceptual Data Model
   - List all major entities (Farmer, Buyer, Product, Category, Order, Payment, Delivery, Quality Control)
   - Describe relationships with cardinality
   
   3.2 Logical Schema Design
   - Show ASCII relationship diagram with cardinality
   - Explain associative tables
   
   3.3 Physical Database Design
   - Explain design decisions
   - Include CREATE TABLE example
   
   3.4 Normalization Analysis
   - Explain 1NF, 2NF, 3NF with examples
   
   3.5 Functional Dependency Analysis
   - Show 5-8 functional dependency examples
   
   3.6 Denormalization Considerations
   - Discuss materialized views and summary tables

   ---

   CHAPTER IV: MYSQL IMPLEMENTATION
   - Include actual SQL code examples for each subsection
   - Show proper syntax and best practices

   ---

   CHAPTER V: PERFORMANCE OPTIMIZATION
   - List 8-10 typical agricultural system queries
   - Show optimization techniques
   - Explain transaction flows
   - Describe concurrency control strategies

   ---

4. AGRICULTURAL SYSTEM SPECIFICS
   - Farmers/Suppliers managing product listings
   - Product categories (vegetables, fruits, grains, specialty crops)
   - Seasonal availability and crop cycles
   - Quality grading and certifications
   - Bulk orders from wholesalers and retailers
   - Perishable goods inventory management
   - Agricultural payment processing
   - Produce delivery and logistics
   - Multiple buyer types
   - Harvest scheduling

5. FORMATTING REQUIREMENTS
   - Professional business writing
   - Numbered sections with subsections
   - Bullet points for lists
   - Tables for specifications and data dictionaries
   - Code blocks for SQL (wrap in ```)
   - ASCII diagrams for relationships
   - Consistent terminology
   - 40,000-50,000 words total

6. DELIVERABLES
   Generate COMPLETE documentation as one cohesive document.
```

---

## How to Use This Prompt

### **FASTEST WAY - Copy & Paste to Claude:**

1. Go to **claude.ai** (or your Claude interface)
2. **Copy everything between the triple backticks** (the "```" markers) in section "The Complete Prompt to Use with Claude"
3. **Paste into Claude chat**
4. **Wait 2-3 minutes** for full documentation generation

### **Expected Output:**
- 40,000-50,000 words of professional documentation
- 5 complete chapters matching your grocery reference format
- All SQL code examples
- Data dictionaries with all agricultural entities
- Complete ER diagrams and relationships
- Ready to use for development

---

## Quick Customization (Optional)

Add this at the END of the prompt if you want it more specific:

```
ADDITIONAL CUSTOMIZATIONS FOR AGRIMARKET:
- Add these agricultural-specific tables to data dictionary: HarvestSchedules, CropVarieties, FarmProfiles, QualityGrades
- Include sustainability tracking fields (organic certification, eco-friendly practices)
- Add bulk pricing tier system for wholesale buyers
- Include seasonal availability logic
- Add farmer reputation/rating system
- Include real-time inventory updates for perishable items
```

---

## Expected Time

- **Generation Time:** 2-3 minutes for full documentation
- **File Size:** ~80-100 KB when complete
- **Readiness:** Immediately usable for development

That's why I created the file with full instructions!