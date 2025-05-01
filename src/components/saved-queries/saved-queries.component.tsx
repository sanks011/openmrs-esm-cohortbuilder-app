import React, { useState, useEffect } from 'react';
import { DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell, Pagination } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { showSnackbar } from '@openmrs/esm-framework';
import type { DefinitionDataRow, PaginationData } from '../../types';
import { deleteDataSet, getQueries } from './saved-queries.resources';
import EmptyData from '../empty-data/empty-data.component';
import SavedQueriesOptions from './saved-queries-options/saved-queries-options.component';
import mainStyles from '../../cohort-builder.scss';
import styles from './saved-queries.scss';

interface SavedQueriesProps {
  onViewQuery: (queryId: string) => Promise<void>;
}

const SavedQueries: React.FC<SavedQueriesProps> = ({ onViewQuery }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [queries, setQueries] = useState<DefinitionDataRow[]>([]);

  const getTableData = async () => {
    const queries = await getQueries();
    setQueries(queries);
  };

  const deleteQuery = async (queryId: string) => {
    try {
      await deleteDataSet(queryId);
      showSnackbar({
        title: t('success', 'Success'),
        kind: 'success',
        isLowContrast: true,
        subtitle: t('queryIsDeleted', 'the query is deleted'),
      });
      getTableData();
    } catch (error) {
      showSnackbar({
        title: t('error', 'Error'),
        kind: 'error',
        isLowContrast: false,
        subtitle: error?.message,
      });
    }
  };

  useEffect(() => {
    getTableData();
  }, []);

  const headers = [
    {
      key: 'name',
      header: t('name', 'Name'),
    },
    {
      key: 'description',
      header: t('description', 'Description'),
    },
  ];

  const handlePagination = ({ page, pageSize }: PaginationData) => {
    setPage(page);
    setPageSize(pageSize);
  };

  return (
    <div className={styles.container}>
      <p className={mainStyles.text}>
        {t('savedQueryDescription', 'You can only search for Query Definitions that you have saved using a Name.')}
      </p>
      <DataTable rows={queries} headers={headers} useZebraStyles>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                ))}
                <TableHeader className={mainStyles.optionHeader}></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows
                .slice((page - 1) * pageSize)
                .slice(0, pageSize)
                .map((row, index: number) => (
                  <TableRow {...getRowProps({ row })} key={index}>
                    {row.cells.map((cell, index) => (
                      <TableCell key={index}>{cell.value}</TableCell>
                    ))}
                    <TableCell className={mainStyles.optionCell}>
                      <SavedQueriesOptions query={queries[index]} onViewQuery={onViewQuery} deleteQuery={deleteQuery} />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </DataTable>
      {queries.length > 10 && (
        <Pagination
          backwardText={t('previousPage', 'Previous page')}
          forwardText={t('nextPage', 'Next page')}
          itemsPerPageText={t('itemsPerPage', 'Items per page:')}
          onChange={handlePagination}
          page={1}
          pageSize={10}
          pageSizes={[10, 20, 30, 40, 50]}
          size="md"
          totalItems={queries.length}
        />
      )}
      {!queries.length && <EmptyData displayText={t('queries', 'queries')} />}
    </div>
  );
};

export default SavedQueries;
