from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    LinearRegressionAnalysisResponse,
    MLModelRunResponse,
)
from app.services.analytics_service import AnalyticsService
from app.services.ml_training_service import MLTrainingService


router = APIRouter(tags=["analytics"])


@router.get("/analytics/overview", response_model=AnalyticsOverviewResponse)
def analytics_overview(db: DBSession = Depends(get_db)) -> AnalyticsOverviewResponse:
    return AnalyticsService(db).overview()


@router.get("/analytics/linear-regression", response_model=LinearRegressionAnalysisResponse)
def linear_regression_analysis(
    db: DBSession = Depends(get_db),
) -> LinearRegressionAnalysisResponse:
    return AnalyticsService(db).linear_regression_analysis()


@router.post("/analytics/train/linear", response_model=MLModelRunResponse)
def train_linear(db: DBSession = Depends(get_db)) -> MLModelRunResponse:
    return MLTrainingService(db).train_linear()


@router.post("/analytics/train/logistic", response_model=MLModelRunResponse)
def train_logistic(db: DBSession = Depends(get_db)) -> MLModelRunResponse:
    return MLTrainingService(db).train_logistic()
