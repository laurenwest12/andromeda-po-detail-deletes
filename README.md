# Andromeda PO Detail Deletes 

## Description

Program that compares the PO detail rows in [Andromenda-DownFrom].[dbo].[ProductionOrderDetailImportArchive] to the PO detail rows that are currently in Andromeda. If there are detail rows that are in the table, but not in Andromeda, then they will be deleted from the table.

## Schedule

- Every 30 minutes on :50 and :20.

## How To Run

There are two ways to run the program.

1. In the task scheduler in NGCANC, right click 'Andromeda PO Detail Deletes' and click "Run".
2. Navigate to the location of the program in a terminal window and type "npm run start".

## How It Works

1. Pulls all PO Detail ids currently in Andromeda.
2. Gets all PO Detail ids that are in [Andromenda-DownFrom].[dbo].[ProductionOrderDetailImportArchive].
3. Compares Andromeda ids with DB ids, finding any differences. 
4. Inserts the ids that need to be deleted (in DB, but not in Andromeda) into the table [Andromenda-DownFrom].[dbo].[ProductionOrderDetailDeletes].
5. Deletes any ids in [Andromenda-DownFrom].[dbo].[ProductionOrderDetailDeletes] from [Andromenda-DownFrom].[dbo].[ProductionOrderDetailImportArchive].
6. Gets any rows that have a deleted id from [Andromeda-UpTo].[dbo].[ProductionOrdersImport].
7. Updates rows in [Andromeda-UpTo].[dbo].[ProductionOrdersImport] that have deleted ids to the correct detail id by finding the same idPO, style, and color from [Andromenda-DownFrom].[dbo].[ProductionOrderDetailImportArchive]. This can happen if a detail row was duplicated.
8. After deletes have been handled, this sends any Production Orders that were pulled from Andromeda PO Down to ECHO-INT.