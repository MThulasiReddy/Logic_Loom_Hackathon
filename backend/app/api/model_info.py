from fastapi import APIRouter
from ..services.ml_service import MLInferenceService
from ..schemas.transaction import ModelInfoResponse

router = APIRouter(prefix="/api/model", tags=["Model Information"])

@router.get("/info", response_model=ModelInfoResponse)
def get_model_information():
    service = MLInferenceService.get_instance()
    info = service.get_model_info()
    return ModelInfoResponse(**info)
