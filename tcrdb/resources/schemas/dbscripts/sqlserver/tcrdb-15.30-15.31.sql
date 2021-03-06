/*
 * Copyright (c) 2015 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

-- Create schema, tables, indexes, and constraints used for tcrdb module here
-- All SQL VIEW definitions should be created in tcrdb-create.sql and dropped in tcrdb-drop.sql
CREATE SCHEMA tcrdb;
GO
CREATE TABLE tcrdb.mixcr_libraries (
  rowid int IDENTITY(1,1),
  species varchar(100),
  locus varchar(100),
  local bit,
  additionalParams varchar(4000),
  
  container entityid,
  created datetime,
  createdby int,
  modified datetime,
  modifiedby int,
  
  constraint PK_mixcr_libraries PRIMARY KEY (rowid)
);