import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, ClickableTile } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';

const CohortBuilderAdminLink: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Layer>
      <a href={`${window.spaBase}/cohort-builder`} target="_blank" rel="noopener noreferrer">
        <ClickableTile href={`${window.spaBase}/cohort-builder`}>
          <div>
            <div className="heading">{t('manageCohorts', 'Manage Cohorts')}</div>
            <div className="content">{t('cohortBuilder', 'Cohort Builder')}</div>
          </div>
          <div className="iconWrapper">
            <ArrowRight size={16} />
          </div>
        </ClickableTile>
      </a>
    </Layer>
  );
};

export default CohortBuilderAdminLink;
