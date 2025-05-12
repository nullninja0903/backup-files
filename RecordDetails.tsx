import React, { useRef, useEffect, useState } from "react";
import { BlobServiceClient } from "@azure/storage-blob";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { RadioButton, RadioButtonChangeEvent } from "primereact/radiobutton";
import { Button } from "primereact/button";
import FeatherIcon from "../common/FeatherIconComponent";
import Input from "../../utils/Input";
import { RootState } from "../../store/store";
import {
  fetchAdditionaMemberPosition,
  fetchDataForMemberShipPosition,
  fetchDataForRecordSubType,
  fetchDataForRecordType,
} from "../../services/apiUtils";
import { fetchData, postData, putData } from "../../services/apiService";
import { useLanguageContext } from "../LanguageContext";
import pdfIcon from "../../assets/icons/fileIcon.svg";
import {
  configureRecordRequest,
  createNewRecordData,
} from "../../slices/createRecordSlice";
import CreateRecordHeader from "./createRecordHeader";
import { focusOnErrorField } from "../../utils/focusError";
import RecordListDocument from "../common/RecordListDocument";
import CreateTerminateRecordHeader from "./createTerminateRecordHeader";
import ConfirmDialogComponent from "../common/ConfirmDialogComponent";
import { useFetchRecordType } from "../../hooks/useRecordType";
import { setToast } from "../../slices/toastSlice";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { cretaeBulkUploadPayload } from "../../utils/utils";
import { handleEndDate } from "../common/CommitteeUtills";
import { READY_FOR_BALLOTING_OPTIONS } from "./constants";
import { Message } from "primereact/message";

type DropdownOption = {
  label: string;
  value: string;
};

interface TerminateReason {
  Reason: string;
  Description: string;
  Id: string;
}

interface Record {
  StatusName: string;
}

interface RecordDetails {
  membershipPositionId: string;
  categoryOfInterestId: string;
  remark: string;
  committeeId: string;
  id: string;
  recordTypeId: string;
  MembershipEndReasonId: string;
  userProfileId?: string;
  isDirty?: boolean;
  isNew?: boolean;
  title: string;
  represents: string;
  representsStartDate: any;
  staffNotes: string;
  committeeJoinDate: any;
  committeeLeaveDate: any;
  exsistingAdditionalMemberPosition: string;
  additionalMemberPositionId: string;
}

interface AxiosError extends Error {
  response?: {
    status?: number;
    data?: {
      messages?: string[];
    };
  };
}

const RecordDetails: React.FC = () => {
  const [t, i18n] = useTranslation("record");
  const { selectedLanguage } = useLanguageContext();
  React.useEffect(() => {
    performAction();
  }, [selectedLanguage]);
  const performAction = () => {
    i18n.changeLanguage(selectedLanguage);
  };
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const createRecordData = useSelector(
    (state: RootState) => state.createRecord
  );
  const storedData = sessionStorage.getItem("CommitteeID");
  const selectedCommitteeID = sessionStorage.getItem("CommitteeID");
  let parsedData;
  if (storedData) {
    try {
      parsedData = JSON.parse(storedData);
    } catch (error) {
      parsedData = storedData;
    }
  } else {
    parsedData = {};
  }
  const [fileError, setFileError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [file, setFile] = useState<any | undefined>(undefined);
  const [userDocumentTypeId, setUserDocumentTypeId] = useState<
    string | undefined
  >(undefined);
  const [MemberShipPosition, setMemberShipPosition] = useState<
    DropdownOption[]
  >([]);
  const [additionalMemberPositions, setAdditionalMemberPositions] =
    React.useState<any[]>([]);
  const [recordType, setRecordType] = useState<DropdownOption[]>([]);
  const [recordSubType, setRecordSubType] = useState<DropdownOption[]>([]);
  const [additionaPosition, setAdditionalPosition] = useState<DropdownOption[]>(
    []
  );
  const [MembersName, setMembersName] = useState([]);
  const [CategoryOfInterest, setCategoryOfInterest] = useState<
    DropdownOption[]
  >([]);
  const [saveAsDraftClicked, setSaveAsDraftClicked] = useState(false);
  const [categoryError, setCategoryError] = useState<string>("");
  const [committeeID, setCommitteeID] = useState<string>("");
  const [showDraft, setShowDraft] = useState<any>(true);
  const [readyForballotingError, setReadyForballotingError] =
    useState<string>("");
  const [joinDateError, setJoinDateError] = useState<string>("");
  const [remarkError, setRemarkError] = useState<string>("");
  const [terminationReasonError, setTerminationReasonError] =
    useState<string>("");
  const [positionError, setPositionError] = useState<string>("");
  const [recordTypeError, setRecordTypeError] = useState<string>("");
  const [recordSubTypeError, setRecordSubTypeError] = useState<string>("");
  const [titleError, setTitleError] = useState<string>("");
  const [memberNameError, setMemberNameError] = useState<string>("");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [recordData, setRecordData] = useState<any>(null);
  const [recordStatusId, setRecordStatusId] = useState<string>("");
  const [membershipRecordId, setMembershipRecordId] = useState<any>(null);
  const terminationRecord: string | null =
    sessionStorage.getItem("termination");
  const isTerminationRecordTrue = terminationRecord === "true";
  const [terminateReasons, setTerminateReasons] = useState<TerminateReason[]>(
    []
  );

  const [defaultConfiguration, setDefaultConfiguration] = useState<any>({
    chairTenureLength: 3,
    viceChairTenureLength: 3,
    tenureLength: 99,
  });
  const [recordTypeName, setRecordTypeName] = useState("Membership");
  const [recordDetails, setRecordDetails] = useState<any>({
    membershipPositionId: "",
    categoryOfInterestId: "",
    readyForBalloting: "",
    remark: "",
    committeeId: "",
    id: "",
    recordTypeId: "",
    MembershipEndReasonId: "",
    recordSubType: "",
    title: "",
    represents: "",
    representsStartDate: "",
    staffNotes: "",
    committeeJoinDate: "",
    committeeLeaveDate: "",
    exsistingAdditionalMemberPosition: "",
    additionalMemberPositionId: "",
  });

  const subTypeDisplayName = isTerminationRecordTrue
    ? "Termination"
    : "New Membership";

  const { recordTypeId, recordSubTypeId } = useFetchRecordType(
    "Membership",
    subTypeDisplayName
  );

  const getLocation = useLocation();
  const location = useLocation();
  const from = location.state?.from;
  const urlParams = new URLSearchParams(getLocation.search);
  const currentType = urlParams.get("type") || "";

  useEffect(() => {
    if (from === "recordPreview") {
      localStorage.setItem("recordDraft", "yes");
      setShowDraft(false);
    } else {
      localStorage.removeItem("recordDraft");
    }
  }, [from]);

  React.useEffect(() => {
    let recordId: string | null | undefined;
    let committeeId: string | null | undefined;
    let userProfileId: string | null | undefined;
    if (
      createRecordData.addCommitteeInRecordRequest &&
      createRecordData.addCommitteeInRecordRequest.recordId
    ) {
      recordId = createRecordData.addCommitteeInRecordRequest.recordId;
      setMembershipRecordId(recordId);
    } else {
      const storedData = sessionStorage.getItem("recordId");
      setMembershipRecordId(storedData);
      if (storedData) {
        recordId = storedData;
      }
    }
    if (
      createRecordData.addCommitteeInRecordRequest &&
      createRecordData.addCommitteeInRecordRequest.committeeId
    ) {
      committeeId = createRecordData.addCommitteeInRecordRequest.committeeId;
      setRecordDetails((prevState: any) => ({
        ...prevState,
        committeeId: createRecordData.addCommitteeInRecordRequest.committeeId,
      }));
    } else {
      const storedCommitteeId = sessionStorage.getItem("CommitteeID");
      if (storedCommitteeId) {
        committeeId = storedCommitteeId;
        setRecordDetails((prevState: any) => ({
          ...prevState,
          committeeId: committeeId,
        }));
      }
    }

    if (
      createRecordData.createRecord &&
      createRecordData.createRecord.userProfileId
    ) {
      userProfileId = createRecordData.createRecord.userProfileId;
      setRecordDetails((prevState: any) => ({
        ...prevState,
        userProfileId: userProfileId,
      }));
    } else {
      const storedCommitteeId = sessionStorage.getItem("userProfileId");
      if (storedCommitteeId) {
        userProfileId = storedCommitteeId;
        setRecordDetails((prevState: any) => ({
          ...prevState,
          userProfileId: userProfileId,
        }));
      }
    }

    if (recordId) {
      setEditMode(true);
      const fetchDataMemberRequest = async () => {
        try {
          const responseData = await fetchData("Record", recordId);
          let isReadyForBalloting = !responseData.ReadyForBalloting
            ? "No"
            : "Yes";
          setRecordData(responseData);
          setRecordDetails((prevState: any) => ({
            ...prevState,
            id: responseData.Id,
            remark: responseData.Remark,
            categoryOfInterestId: responseData.CategoryOfInterest.Id,
            readyForBalloting: isReadyForBalloting,
            membershipPositionId: responseData.MembershipPosition.Id,
            recordTypeId: responseData.RecordTypeId,
            recordSubTypeId: responseData.RecordSubTypeId,
            isDirty: true,
            isNew: false,
            userProfileId: responseData.UserProfileId,
            MembershipEndReasonId:
              responseData?.MembershipRemoveRecord?.MembershipEndReasonId,
            recordSubType: responseData?.RecordSubType?.Type,
            title: responseData.Title,
            represents: responseData.Represents,
            representsStartDate: responseData.RepresentsStartDate
              ? new Date(responseData.RepresentsStartDate)
              : null,
            staffNotes: responseData.StaffNotes,
            committeeJoinDate: responseData.CommitteeJoinDate
              ? new Date(responseData.CommitteeJoinDate)
              : null,
            committeeleaveDate: responseData.CommitteeleaveDate
              ? new Date(responseData.CommitteeleaveDate)
              : null,
            BallotNumberRecordIn: responseData.BallotNumberRecordIn
          }));
        } catch (error) {
          console.error("Error fetching Category of Interest:", error);
        }
      };
      fetchDataMemberRequest();

      const fetchAdditionalMemberPositions = async () => {
        try {
          const responseData = await fetchData(
            `RecordAdditionalpositions/GetListByParentId?parentId=${recordId}`
          );

          const formattedPositions = responseData.Collection.map(
            (position: any) => ({
              label: position.AdditionalMemberPositionName,
              value: position.AdditionalMemberPositionId,
            })
          );

          setAdditionalMemberPositions(responseData.Collection);

          setRecordDetails((prevState: any) => ({
            ...prevState,
            additionalMemberPositionId: formattedPositions.map(
              (p: any) => p.value
            ),
          }));
        } catch (error) {
          console.error("Error fetching additional positions:", error);
        }
      };
      fetchAdditionalMemberPositions();
    } else if (committeeId) {
      setEditMode(false);
    }
  }, [createRecordData]);

  useEffect(() => { }, [recordDetails]);
  const handleRecordsStatus = async () => {
    const committeeResponse = await fetchData(
      `RecordStatus/GetAllRecordStatusByRecordTypeName?recordTypeName=${recordTypeName}`
    );
    const draftRecord = committeeResponse.find(
      (item: Record) => item.StatusName === "Draft"
    );
    const openRecord = committeeResponse.find(
      (item: Record) => item.StatusName === "Open"
    );
    setRecordStatusId(draftRecord.Id);
    return {
      draftRecordId: draftRecord?.Id,
      openRecordId: openRecord?.Id,
    };
  };

  const fetchConfiguration = async () => {
    try {
      const labelValueArrayy = await fetchData("CommitteeConfiguration/GetAll");
      if (labelValueArrayy.Collection.length > 0) {
        setDefaultConfiguration((prevState: any) => ({
          ...prevState,
          chairTenureLength: labelValueArrayy.Collection[0]?.ChairTenure || 3,
          viceChairTenureLength:
            labelValueArrayy.Collection[0]?.ViceChairTenure || 3, // Add default if needed
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
    }
  };

  useEffect(() => {
    handleRecordsStatus();
    const fetchData = async () => {
      try {
        const labelValueArray = await fetchDataForMemberShipPosition();
        setMemberShipPosition(labelValueArray);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
    const fetchAdditionalPosition = async () => {
      try {
        const labelValueArrayy = await fetchAdditionaMemberPosition();
        setAdditionalPosition(labelValueArrayy);
      } catch (error) {
        console.error(error);
      }
    };
    fetchAdditionalPosition();
    fetchConfiguration();
  }, []);

  React.useEffect(() => {
    const fetchRecordType = async () => {
      const recordTypes = await fetchDataForRecordType();
      setRecordType(recordTypes || []);
      if (currentType && recordTypes && recordTypes?.length > 0) {
        const membershipItem = recordTypes.find(
          (item: any) => item.name === "Membership"
        );
        const membershipId = membershipItem ? membershipItem.value : null;
        setRecordDetails((prev: any) => ({
          ...prev,
          recordTypeId: membershipId,
        }));
      }
    };
    fetchRecordType();
  }, []);

  React.useEffect(() => {
    const fetchRecordSubType = async () => {
      if (recordDetails.recordTypeId) {
        const subTypes = await fetchDataForRecordSubType(
          recordDetails.recordTypeId
        );
        setRecordSubType(subTypes || []);
        if (currentType && subTypes && subTypes?.length > 0) {
          const getRecordSubTypeItem = subTypes.find(
            (item: any) => item.label === "New Membership"
          );
          const getRecordSubTypeId = getRecordSubTypeItem
            ? getRecordSubTypeItem.value
            : null;
          setRecordDetails((prev: any) => ({
            ...prev,
            recordSubTypeId: getRecordSubTypeId,
          }));
        }
      } else {
        setRecordSubType([]);
      }
    };
    fetchRecordSubType();
  }, [recordDetails.recordTypeId]);

  React.useEffect(() => {
    if (storedData) {
      const fetchcategoryOfRequest = async () => {
        try {
          const responseData = await fetchData("Committee", storedData);
          const categoryOfInterestCommittee =
            responseData.CommitteCategoryofInterests;
          const labelValueArray = categoryOfInterestCommittee.map(
            (category: any) => ({
              label: category.CategoryOfInterest.CategoryName,
              value: category.CategoryOfInterest.Id,
            })
          );
          setCategoryOfInterest(labelValueArray);
        } catch (error) {
          console.error("Error fetching Category of Interest:", error);
        }
      };
      fetchcategoryOfRequest();
    }
  }, [recordDetails.committeeId]);

  React.useEffect(() => {
    if (recordDetails.committeeId) {
      const fetchcategoryOfRequest = async () => {
        try {
          const responseData = await fetchData(
            "Committee",
            recordDetails.committeeId
          );
          const categoryOfInterestCommittee =
            responseData.CommitteCategoryofInterests;
          const labelValueArray = categoryOfInterestCommittee.map(
            (category: any) => ({
              label: category.CategoryOfInterest.CategoryName,
              value: category.CategoryOfInterest.Id,
            })
          );
          setCategoryOfInterest(labelValueArray);
        } catch (error) {
          console.error("Error fetching Category of Interest:", error);
        }
      };
      fetchcategoryOfRequest();
    }
  }, [recordDetails.committeeId]);

  const percent = 70; // Set your percentage here

  const circleStyle = {
    "--percent": `${percent}`, // Set the percentage as a custom CSS variable
  };

  const handleMultiSelectChange = (e: any) => {
    const { name, value } = e;
    setRecordDetails((prevData: any) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    let updatedData: any = {};
    setRecordDetails((prevData: any) => {
      if (name === "membershipPositionId" && value) {
        updatedData = {
          ...prevData,
          [name]: value,
          ["committeeJoinDate"]: null,
          ["committeeLeaveDate"]: null,
        };
      } else {
        updatedData = {
          ...prevData,
          [name]: value,
        };
      }
      if (name === "committeeJoinDate" && value) {
        const member = MemberShipPosition?.find(
          (item: any) => item.value === recordDetails.membershipPositionId
        );

        const memberName = member?.label.toLowerCase();
        let positionData: any = ["chair", "vice chair"];
        let tenureLength = 99;
        if (positionData.includes(memberName)) {
          tenureLength =
            memberName === "chair"
              ? defaultConfiguration.chairTenureLength
              : defaultConfiguration.viceChairTenureLength;
        }
        let leaveDate: any = handleEndDate(
          value,
          memberName || "",
          tenureLength
        );

        updatedData.committeeLeaveDate = leaveDate;
      }
      return updatedData;
    });

    switch (name) {
      case "recordTypeId":
        setRecordTypeError(value ? "" : t("record.selectRecordType"));
        break;
      case "recordSubTypeId":
        setRecordSubTypeError(value ? "" : t("record.selectRecordSubType"));
        break;
      case "title":
        setTitleError(value ? "" : t("record.selectTitle"));
        break;
      case "membershipPositionId":
        setPositionError(value ? "" : t("record.selectMembershipPosition"));
        break;
      case "categoryOfInterestId":
        setCategoryError(value ? "" : t("record.selectCoi"));
        break;
      case "readyForBalloting":
        setReadyForballotingError(
          value ? "" : t("record.selectReadyForBalloting")
        );
        break;
      case "committeeJoinDate":
        setJoinDateError(value ? "" : t("record.selectJoinDate"));
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (recordDetails?.MembershipRemoveRecord?.MembershipEndReasonId) {
      setRecordDetails((prevDetails: RecordDetails) => ({
        ...prevDetails,
        MembershipEndReasonId:
          recordDetails?.MembershipRemoveRecord?.MembershipEndReasonId,
      }));
    }
  }, [recordDetails]);

  const handleReasonChange = (e: RadioButtonChangeEvent) => {
    const selectedReasonId = e.value;
    setRecordDetails((prevDetails: RecordDetails) => ({
      ...prevDetails,
      MembershipEndReasonId: selectedReasonId,
    }));
    if (e.value) {
      setTerminationReasonError("");
    }
  };

  const validateForm = () => {
    let isValid = true;

    const errors: { [key: string]: string } = {};

    if (!recordDetails.membershipPositionId) {
      errors.positionError = t("record.selectMembershipPosition");
      isValid = false;
    }

    if (!recordDetails.recordTypeId) {
      errors.recordTypeError = t("record.selectRecordType");
      isValid = false;
    }

    if (!recordDetails.recordSubTypeId) {
      errors.recordSubTypeError = t("record.selectRecordSubType");
      isValid = false;
    }

    if (!recordDetails.title) {
      errors.titleError = t("record.selectTitle");
      isValid = false;
    }

    if (!recordDetails.userProfileId) {
      errors.memberNameError = t("record.selectMember");
      isValid = false;
    }

    if (CategoryOfInterest.length > 0 && !recordDetails.categoryOfInterestId) {
      errors.categoryError = t("record.selectCoi");
      isValid = false;
    }
    if (!recordDetails.readyForBalloting) {
      errors.readyForBallotingError = t("record.selectReadyForBalloting");
      isValid = false;
    }
    if (!recordDetails.committeeJoinDate) {
      errors.joinDateError = t("record.selectJoinDate");
      isValid = false;
    }

    if (isTerminationRecordTrue && !recordDetails.remark) {
      errors.remarkError = t("record.remarkRequired");
      isValid = false;
    }

    if (isTerminationRecordTrue && !recordDetails.MembershipEndReasonId) {
      errors.terminationReasonError = t("record.reasonRequired");
      isValid = false;
    }

    // Set all errors in one state update to avoid multiple re-renders
    setPositionError(errors.positionError || "");
    setRecordTypeError(errors.recordTypeError || "");
    setRecordSubTypeError(errors.recordSubTypeError || "");
    setTitleError(errors.titleError || "");
    setMemberNameError(errors.memberNameError || "");
    setCategoryError(errors.categoryError || "");
    setReadyForballotingError(errors.readyForBallotingError || "");
    setJoinDateError(errors.joinDateError || "");
    setRemarkError(errors.remarkError || "");
    setTerminationReasonError(errors.terminationReasonError || "");

    return isValid; // Returns true only if all fields are valid
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTimeout(() => {
      focusOnErrorField(".p-invalid");
    }, 100);

    if (!validateForm()) {
      return;
    }

    let requestData = recordDetails;
    let isReadyForBalloting =
      requestData.readyForBalloting === "Yes" ? true : false;
    const { draftRecordId, openRecordId } = await handleRecordsStatus();
    const selectedRecordStatusId = saveAsDraftClicked
      ? draftRecordId
      : openRecordId;

    if (editMode) {
      requestData = {
        isDirty: recordDetails.isDirty,
        isNew: recordDetails.isNew,
        recordTypeId: recordDetails.recordTypeId,
        committeeId: recordDetails.committeeId,
        membershipPositionId: recordDetails.membershipPositionId,
        categoryOfInterestId: recordDetails.categoryOfInterestId || null,
        ReadyForBalloting: isReadyForBalloting,
        remark: recordDetails.remark,
        title: recordDetails.title,
        represents: recordDetails.represents,
        representsStartDate: recordDetails.representsStartDate || null,
        staffNotes: recordDetails.staffNotes,
        committeeJoinDate: recordDetails.committeeJoinDate,
        committeeleaveDate: recordDetails.committeeleaveDate,
        userProfileId: recordDetails.userProfileId,
        approveMembershipRemark: "",
        recordStatusId: draftRecordId,
        MembershipEndReasonId: isTerminationRecordTrue
          ? recordDetails.MembershipEndReasonId!
          : null,
        recordSubTypeId: recordDetails.recordSubTypeId,
      };
    } else {
      requestData = {
        committeeId: recordDetails.committeeId,
        membershipPositionId: recordDetails.membershipPositionId,
        categoryOfInterestId: recordDetails.categoryOfInterestId || null,
        ReadyForBalloting: isReadyForBalloting,
        remark: recordDetails.remark,
        title: recordDetails.title,
        represents: recordDetails.represents,
        representsStartDate: recordDetails.representsStartDate || null,
        staffNotes: recordDetails.staffNotes,
        committeeJoinDate: recordDetails.committeeJoinDate,
        committeeLeaveDate: recordDetails.committeeLeaveDate,
        userProfileId: recordDetails.userProfileId,
        MembershipEndReasonId: isTerminationRecordTrue
          ? recordDetails.MembershipEndReasonId!
          : null,
        recordStatusId: draftRecordId,
        recordTypeId: recordDetails.recordTypeId,
        recordSubTypeId: recordDetails.recordSubTypeId,
      };
    }

    if (saveAsDraftClicked) {
      await handlePostData(requestData);
    } else {
      await handlePostData(requestData);
    }
  };

  const initializeBlobService = async (documentResponse: any) => {
    const connectionString = `https://${documentResponse?.storageAccountName}.blob.core.windows.net?${documentResponse?.sasToken}`;

    const blobServiceClient = new BlobServiceClient(connectionString);
    return blobServiceClient;
  };

  const handleFetchUserDocument = async (recordId: string) => {
    try {
      const documentResponse = await fetchData(
        `RecordDocument/GetRecordDocumentValetKey?RecordId=${recordId}&userDocumentType=RecordDocument`
      );
      return documentResponse;
    } catch (error) {
      console.error("Error fetching user document:", error);
    }
  };

  const uploadDocuments = async (
    filesArray: File[],
    documentResponse: any,
    recordID: string
  ) => {
    if (documentResponse && filesArray.length > 0) {
      const blobService = await initializeBlobService(documentResponse);
      const userDocumentDataArray = [];

      for (let i = 0; i < filesArray.length; i++) {
        const fileName = filesArray[i];
        const fileBlob = new Blob([fileName], {
          type: "application/octet-stream",
        });

        const containerName = documentResponse.containerName;
        const sub = containerName.substring(0, containerName.length - 1);
        const containerClient = blobService.getContainerClient(sub);
        const currentTime = Date.now();
        const blobName = `${currentTime}_${fileName.name}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const uploadBlobResponse = await blockBlobClient.uploadBrowserData(
          fileBlob,
          {
            blockSize: 4 * 1024 * 1024,
            concurrency: 20,
          }
        );

        const url = uploadBlobResponse._response.request.url;
        const parts = url.split("?");
        const modifiedBlobUrl = parts[0];

        if (modifiedBlobUrl) {
          // Create document data object for the current file
          const userDocumentData = {
            isDirty: true,
            isNew: true,
            isActive: true,
            isDeleted: false,
            recordId: recordID,
            documentName: fileName.name,
            documentTypeId: userDocumentTypeId,
            blobURL: modifiedBlobUrl,
            recordDocumentId: "00000000-0000-0000-0000-000000000000",
          };
          userDocumentDataArray.push(userDocumentData); // Add to the array
        }
      }

      // Post all document data at once
      if (userDocumentDataArray.length > 0) {
        await postData("RecordDocument/BulkUpload", userDocumentDataArray);
      }
    }
  };

  const handlePostData = async (formDetails: any) => {
    try {
      dispatch(createNewRecordData(formDetails));

      let recordID: string;

      if (editMode) {
        const putDataResponse = await putData(
          "Record",
          recordDetails.id,
          formDetails
        );
        const responseObject = JSON.parse(putDataResponse.content);
        recordID = responseObject.Id;
      } else {
        const postDataResponse = await postData(
          "Record/AddRecordMembership",
          formDetails
        );
        recordID = postDataResponse.id;
      }

      // Store record ID and dispatch config
      sessionStorage.setItem("recordId", recordID);
      dispatch(configureRecordRequest({ recordId: recordID }));

      // Upload documents if any
      const documentResponse = await handleFetchUserDocument(recordID);
      if (file) {
        await uploadDocuments(file, documentResponse, recordID);
      }

      // Prepare and upload additional member positions
      const existingPositionsMap = new Map(
        additionalMemberPositions?.map((pos: any) => [
          pos.AdditionalMemberPositionId,
          pos.Id,
        ])
      );

      const oldPositions = Array.from(existingPositionsMap.keys());
      const newPositions = recordDetails.additionalMemberPositionId;

      const positionPayload = cretaeBulkUploadPayload(
        oldPositions,
        newPositions,
        "additionalMemberPositionId"
      ).map((item: any) => ({
        ...item,
        recordId: recordID,
        recordAdditionalpositionId:
          existingPositionsMap.get(item.additionalMemberPositionId) ||
          "00000000-0000-0000-0000-000000000000",
      }));

      if (positionPayload.length) {
        await postData("RecordAdditionalpositions/BulkUpload", positionPayload);
      }

      // Show toast and navigate accordingly
      if (saveAsDraftClicked) {
        dispatch(
          setToast({
            message: t(
              editMode ? "record.dataUpdatedDraft" : "record.dataSavedDraft"
            ),
            severity: "success",
          })
        );
        navigate("/record");
      } else {
        const targetPath = currentType
          ? `/record/preview?type=${currentType}`
          : "/record/preview";

        navigate(
          targetPath,
          terminationRecord ? { state: { activeTabIndex: 2 } } : {}
        );
      }
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleError = (error: unknown) => {
    console.error("Error posting data:", error);

    if (isAxiosError(error)) {
      const { response } = error;

      if (response && response.status === 400) {
        const messages = response.data;

        if (
          Array.isArray(messages) &&
          messages.includes("Membership request already exists")
        ) {
          errorMessageToast(t("record.alreadyExist"));
          return;
        }
      }

      errorMessageToast(t("record.errorPostingData"));
    } else {
      errorMessageToast(t("record.errorPostingData"));
    }
  };

  function isAxiosError(error: unknown): error is AxiosError {
    return (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      (error as AxiosError).response !== undefined
    );
  }

  const errorMessageToast = (msg: string) => {
    dispatch(setToast({ message: msg, severity: "error", duration: 3000 }));
  };

  const [visible, setVisible] = useState<boolean>(false);

  const handleConfirm = () => {
    let navigateFrom = sessionStorage.getItem("redirectionPath");
    if (navigateFrom === "record") {
      let committeeId = sessionStorage.getItem("CommitteeID");
      navigate(`/committee/details/${committeeId}`);
    } else {
      navigate("/record");
    }
  };

  const handleCancel = () => {
    setVisible(true);
  };

  const handleCancelDialog = () => {
    setVisible(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const validExtensions = [
      ".xlsx",
      ".xls",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".txt",
      ".pdf",
      ".csv",
    ];
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      setFileError("");
      let totalSize = 0;
      const filesArray: any[] = [];
      let invalidFiles = false;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExtension = file.name
          .slice(file.name.lastIndexOf("."))
          .toLowerCase();

        if (!validExtensions.includes(fileExtension)) {
          setErrorMessage(`${t("profile.invalidFileType")}: ${file.name}`);
          invalidFiles = true;
          break;
        }

        totalSize += file.size;
        filesArray.push(file);
      }

      if (!invalidFiles) {
        const totalSizeInMB = totalSize / (1024 * 1024);
        if (totalSizeInMB <= 500) {
          setFile(filesArray);
          setErrorMessage(undefined);
        } else {
          setErrorMessage(`${t("record.totalFileSizeExceed500")}`);
          setFile(undefined);
        }
      } else {
        setFile(undefined);
      }
    } else {
      setFile(undefined);
      setErrorMessage(undefined);
    }
  };

  const handleDelete = (index: number) => {
    if (file) {
      const updatedFiles = [...file];
      updatedFiles.splice(index, 1);
      setFile(updatedFiles);
    }
  };

  const getAll = async () => {
    const fetchAllDocuments = await fetchData("DocumentType/GetAll");
    const documents = fetchAllDocuments.Collection;
    for (const document of documents) {
      if (document.TypeName === "RecordDocument") {
        setUserDocumentTypeId(document.Id);
        break;
      }
    }
  };

  const selectMemberName = async () => {
    if (selectedCommitteeID) {
      try {
        const CommitteeMemberResponse = await fetchData(
          `CommitteeMembership/GetListByParentId?parentId=${selectedCommitteeID}`
        );
        const memberOptions = CommitteeMemberResponse.collection.map(
          (item: any) => ({
            label: item.userProfile.firstname + " " + item.userProfile.lastname,
            value: item.userProfileId,
          })
        );
        setMembersName(memberOptions);
      } catch (error) {
        console.error("Error fetching committee members: ", error);
      }
    }
  };

  const handleMemberChange = async (e: DropdownChangeEvent) => {
    const selectedUserProfileId = e.value;
    setRecordDetails({
      ...recordDetails,
      userProfileId: selectedUserProfileId,
    });
    if (e.value) {
      setMemberNameError("");
      setPositionError("");
      setCategoryError("");
    }
    try {
      const coiResponse = await fetchCOIByUserProfileIdAndCommiteeId(
        selectedUserProfileId
      );
      if (coiResponse && typeof coiResponse === "object") {
        const coiOption: DropdownOption = {
          label: coiResponse.CategoryOfInterest,
          value: coiResponse.CategoryOfInterestId,
        };

        const membershipPositionOption: DropdownOption = {
          label: coiResponse.MembershipPositionName,
          value: coiResponse.MembershipPositionId,
        };

        setCategoryOfInterest([coiOption]);
        setMemberShipPosition([membershipPositionOption]);

        setRecordDetails((prevRecord: any) => ({
          ...prevRecord,
          categoryOfInterestId: coiOption.value,
          membershipPositionId: membershipPositionOption.value,
        }));
      } else {
        console.error("Unexpected COI response format", coiResponse);
        setCategoryOfInterest([]);
        setMemberShipPosition([]);
      }
    } catch (error) {
      console.error("Error handling COI:", error);
      setCategoryOfInterest([]);
      setMemberShipPosition([]);
    }
  };

  const fetchCOIByUserProfileIdAndCommiteeId = async (
    userProfileId: string
  ): Promise<any> => {
    try {
      const CommitteeMemberCOIResponse = await fetchData(
        `CommitteeMembership/GetCategoryOfInterestByUserProfileId?userProfileId=${userProfileId}&commiteeId=${selectedCommitteeID}`
      );
      const response = CommitteeMemberCOIResponse;

      if (
        response &&
        typeof response === "object" &&
        !Array.isArray(response)
      ) {
        return response;
      } else {
        console.error("Unexpected COI response format", response);
        return {};
      }
    } catch (error) {
      console.error("Error fetching COI:", error);
      return {};
    }
  };

  const MembershipTerminateReason = async () => {
    try {
      const terminateReason = await fetchData(`MembershipEndReason/GetAll`);
      if (terminateReason && terminateReason.Collection) {
        setTerminateReasons(terminateReason.Collection);
      }
    } catch (error) {
      console.error("Error fetching termination reasons:", error);
    }
  };

  React.useEffect(() => {
    getAll();
    selectMemberName();
    MembershipTerminateReason();
  }, []);

  return (
    <>
      <ConfirmDialogComponent
        visible={visible}
        onHide={() => setVisible(false)}
        message="Are you sure you want to exit?"
        header="Confirmation"
        onConfirm={() => handleConfirm()}
        onCancel={() => handleCancelDialog()}
      />
      {terminationRecord ? (
        <CreateTerminateRecordHeader activeStep={1} />
      ) : (
        <CreateRecordHeader activeStep={2} />
      )}
      {
        editMode && recordDetails.BallotNumberRecordIn !== null && (
          <Message
            severity="warn"
            className="mb-3"
            text={`This record is part of ballot number ${recordDetails?.BallotNumberRecordIn}.`}
          />
        )
      }
      <form onSubmit={handleSubmit}>
        <div className="card bg-white w-full mb-5 shadow-md">
          <div className="flex align-items-center align-self-center px-5 py-4 border-bottom-1 border-gray-200 gap-3 cardHeader">
            <div className="flex flex-column gap-1">
              <h2 className="text-title text-lg font-bold m-0">
                {terminationRecord
                  ? t("record.committeeMemberPosition")
                  : t("record.selectCommitteeAndPosition")}
              </h2>
              <p className="text-base font-normal m-0 text-help">
                {t("record.allFieldsRequired")}
              </p>
            </div>
          </div>
          {(isTerminationRecordTrue ||
            recordDetails?.RecordSubType?.Type === "Termination") && (
              <div className="grid grid-xl px-5 py-0 pt-2 mt-4">
                <div className="flex flex-column gap-2 xl:col-3 lg:col-4 md:col-6 col-12">
                  <label
                    htmlFor="memberName"
                    className="block font-bold text-input-label capitalize"
                  >
                    {t("record.selectMember")}
                    <span className="text-red-500 align-top">*</span>
                  </label>
                  <Dropdown
                    inputId="memberName"
                    aria-describedby="memberNameError"
                    value={recordDetails.userProfileId}
                    onChange={handleMemberChange}
                    options={MembersName}
                    optionLabel="label"
                    placeholder={t("record.selectAnOption")}
                    className="w-full"
                  />
                  <span
                    id="positionError"
                    className={`p-error font-bold text-capitalize ${memberNameError ? "" : "error-hidden"}`}
                  >
                    {memberNameError}
                  </span>
                </div>
              </div>
            )}
          {/* New fields */}
          <div className="grid grid-xl px-5 py-0 pt-2 mt-4">
            {/* Reord type */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="type"
                className={`block font-bold capitalize ${recordTypeError ? " p-error" : "text-input-label"
                  }`}
              >
                {t("record.recordType")}
                <span className="text-red-500 align-top">*</span>
              </label>
              <Dropdown
                name="recordTypeId"
                inputId="recordTypeId"
                aria-describedby="recordTypeError"
                value={recordDetails.recordTypeId}
                onChange={handleInputChange}
                options={recordType}
                optionLabel="name"
                placeholder={t("record.selectAnOption")}
                className={`w-full ${recordTypeError ? "p-invalid" : ""}`}
              />
              <span
                id="recordTypeError"
                className={`p-error font-bold text-capitalize ${recordTypeError ? "" : "error-hidden"}`}
              >
                {recordTypeError}
              </span>
            </div>
            {/* Record subtype */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="subType"
                className={`block font-bold capitalize ${recordSubTypeError ? " p-error" : "text-input-label"
                  }`}
              >
                {t("record.recordSubtype")}
                <span className="text-red-500 align-top">*</span>
              </label>
              <Dropdown
                name="recordSubTypeId"
                inputId="recordSubTypeId"
                aria-describedby="recordSubTypeError"
                value={recordDetails.recordSubTypeId}
                onChange={handleInputChange}
                options={recordSubType}
                optionLabel="label"
                placeholder={t("record.selectAnOption")}
                className={`w-full ${recordSubTypeError ? "p-invalid" : ""}`}
              />
              <span
                id="recordSubTypeError"
                className={`p-error font-bold text-capitalize ${recordSubTypeError ? "" : "error-hidden"}`}
              >
                {recordSubTypeError}
              </span>
            </div>
            {/* Title */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="subType"
                className={`block font-bold capitalize ${titleError ? " p-error" : "text-input-label"
                  }`}
              >
                {t("record.title")}
                <span className="text-red-500 align-top">*</span>
              </label>
              <InputText
                type="text"
                aria-describedby="titleError"
                value={recordDetails.title}
                name="title"
                onChange={handleInputChange}
                placeholder={t("record.title")}
                className={`w-full ${titleError ? "p-invalid" : ""}`}
              />

              <span
                id="titleError"
                className={`p-error font-bold text-capitalize ${titleError ? "" : "error-hidden"}`}
              >
                {titleError}
              </span>
            </div>
          </div>
          <div className="grid grid-xl px-5 py-0 pt-2 mt-4">
            {/* Role */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="position"
                className={`block font-bold capitalize ${positionError ? " p-error" : "text-input-label"
                  }`}
              >
                {t("record.role")}
                <span className="text-red-500 align-top">*</span>
              </label>
              <Dropdown
                name="membershipPositionId"
                inputId="membershipPositionId"
                aria-describedby="positionError"
                value={recordDetails.membershipPositionId}
                onChange={handleInputChange}
                options={MemberShipPosition}
                optionLabel="label"
                placeholder={t("record.selectAnOption")}
                disabled={isTerminationRecordTrue}
                className={`w-full ${positionError ? "p-invalid" : ""}`}
              />
              <span
                id="positionError"
                className={`p-error font-bold text-capitalize ${positionError ? "" : "error-hidden"}`}
              >
                {positionError}
              </span>
            </div>
            {/* Category Of Interest */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="categoryInterest"
                className={`block font-bold capitalize ${categoryError ? " p-error" : "text-input-label"
                  }`}
              >
                {t("record.balancedMatrix")}
                <span className="text-red-500 align-top">*</span>
              </label>
              <Dropdown
                name="categoryOfInterestId"
                inputId="categoryOfInterestId"
                aria-describedby="categoryInterestError"
                value={recordDetails.categoryOfInterestId}
                onChange={handleInputChange}
                options={CategoryOfInterest}
                optionLabel="label"
                placeholder={t("record.selectAnOption")}
                className={`w-full ${categoryError ? "p-invalid" : ""}`}
              />
              <span
                id="categoryInterestError"
                className={`p-error font-bold text-capitalize ${categoryError ? "" : "error-hidden"}`}
              >
                {categoryError}
              </span>
            </div>
            {/* Ready For Balloting */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="readyForBalloting"
                className={`block font-bold capitalize ${readyForballotingError ? " p-error" : "text-input-label"
                  }`}
              >
                {t("record.readyForBallotingLabel")}{" "}
                <span className="text-red-500 align-top">*</span>
              </label>
              <Dropdown
                name="readyForBalloting"
                inputId="readyForBalloting"
                aria-describedby="readyForBallotingError"
                value={recordDetails.readyForBalloting}
                onChange={handleInputChange}
                options={READY_FOR_BALLOTING_OPTIONS}
                optionLabel="label"
                placeholder={t("record.selectAnOption")}
                className={`w-full ${readyForballotingError ? "p-invalid" : ""}`}
                disabled={
                  editMode && recordDetails.BallotNumberRecordIn !== null
                }
              />
              <span
                id="readyForBallotingError"
                className={`p-error font-bold text-capitalize ${readyForballotingError ? "" : "error-hidden"}`}
              >
                {readyForballotingError}
              </span>
            </div>
          </div>
          <div className="grid grid-xl px-5 py-0 pt-2 mt-4">
            {/* Addition member position */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="additionPosition"
                className="block font-bold text-input-label capitalize"
              >
                {t("record.additionPosition")} ({t("record.optional")})
              </label>
              <MultiSelect
                name="additionalMemberPositionId"
                inputId="additionPosition"
                value={recordDetails.additionalMemberPositionId}
                onChange={(e) =>
                  handleMultiSelectChange({
                    name: "additionalMemberPositionId",
                    value: e.value,
                  })
                }
                options={additionaPosition}
                optionLabel="label"
                placeholder={t("record.selectAnOption")}
                className="w-full"
              />
            </div>
            {/* Represents */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="subType"
                className="block font-bold capitalize text-input-label"
              >
                {t("record.represents")} ({t("record.optional")})
              </label>
              <InputText
                type="text"
                value={recordDetails.represents}
                name="represents"
                onChange={handleInputChange}
                placeholder={t("record.represents")}
              />
            </div>
            {/* Committee Membership Comment */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="subType"
                className="block font-bold capitalize text-input-label"
              >
                {t("record.committeeMembershipComment")} ({t("record.optional")}
                )
              </label>
              <InputText
                type="text"
                value={recordDetails.remark}
                name="remark"
                onChange={handleInputChange}
                placeholder={t("record.committeeMembershipComment")}
              />
            </div>
          </div>

          <div className="grid grid-xl px-5 py-0 pt-2 mt-4">
            {/* Represent Start Date */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="representStartDate"
                className="block font-bold text-input-label capitalize"
              >
                {t("record.representStartDate")} ({t("record.optional")})
              </label>
              <Calendar
                name="representsStartDate"
                inputId={`representStartDate`}
                minDate={new Date()}
                value={recordDetails.representsStartDate}
                dateFormat="dd/mm/yy"
                placeholder={t("record.representStartDate")}
                onChange={handleInputChange}
                ariaLabelledBy="representsStartDate"
              />
            </div>
            {/* Staff Notes */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="representStartDate"
                className="block font-bold text-input-label capitalize"
              >
                {t("record.staffNote")} ({t("record.optional")})
              </label>
              <InputText
                type="text"
                value={recordDetails.staffNotes}
                name="staffNotes"
                onChange={handleInputChange}
                placeholder={t("record.staffNote")}
              />
            </div>
            {/* Committee Join Date */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="committeeJoinDate"
                className={`block font-bold capitalize ${joinDateError ? " p-error" : "text-input-label"
                  }`}
              >
                {t("record.committeeJoinDate")}{" "}
                <span className="text-red-500 align-top">*</span>
              </label>
              <Calendar
                inputId={`committeeJoinDate`}
                minDate={new Date()}
                value={recordDetails.committeeJoinDate}
                dateFormat="dd/mm/yy"
                placeholder={t("record.committeeJoinDate")}
                onChange={handleInputChange}
                name="committeeJoinDate"
                ariaLabelledBy="committeeJoinDate"
                className={`w-full ${joinDateError ? "p-invalid" : ""}`}
              />
              <span
                id="joinDateError"
                className={`p-error font-bold text-capitalize ${joinDateError ? "" : "error-hidden"}`}
              >
                {joinDateError}
              </span>
            </div>
          </div>
          <div className="grid grid-xl px-5 py-0 pt-2 mt-4">
            {/* Committee Leave Date */}
            <div className="flex flex-column gap-2 xl:col-4 lg:col-4 md:col-6 col-12">
              <label
                htmlFor="committeeLeaveDate"
                className="block font-bold text-input-label capitalize"
              >
                {t("record.committeeLeaveDate")} ({t("record.optional")})
              </label>
              <Calendar
                inputId={`committeeLeaveDate`}
                minDate={new Date()}
                value={
                  recordDetails.committeeLeaveDate ||
                  recordDetails.committeeleaveDate
                }
                dateFormat="dd/mm/yy"
                placeholder={t("record.committeeLeaveDate")}
                onChange={handleInputChange}
                name="committeeLeaveDate"
                ariaLabelledBy="committeeLeaveDate"
              />
            </div>
          </div>
          <div className="grid grid-xl px-5 py-0 pt-2 mt-4">
            <div className="xl:col-6 lg:col-8 md:col-12 col-12">
              <h2 className="font-bold text-base">
                {t("record.requestDouments")}
              </h2>
              <div className="relative md:w-16rem custom-file-upload mb-2">
                <input
                  type="file"
                  id="fileInput1"
                  aria-labelledby="fileInput1"
                  accept=".xlsx,.xls,.doc, .docx,.ppt, .pptx,.txt,.pdf,.csv"
                  multiple
                  onChange={handleChange}
                />
                <label
                  htmlFor="fileInput1"
                  className="flex flex-column align-items-center justify-content-center gap-2 p-3"
                >
                  <span className="bg-brand-500 border-circle flex align-items-center justify-content-center">
                    <FeatherIcon
                      name="plus"
                      size={32}
                      color="var(--icon-white)"
                      onClick={undefined}
                    />
                  </span>
                  <span className="text-sm font-normal">
                    {t("record.browseDosPlacehoder")} <br />
                    {t("record.maxFileSize")}
                  </span>
                </label>
              </div>
              {membershipRecordId && (
                <RecordListDocument
                  documentType="RecordDocument"
                  membershipRecordID={membershipRecordId}
                  showNoDataMessage={false}
                />
              )}

              <div>
                {errorMessage && (
                  <div key="errorMessage" className="p-error font-bold">
                    {errorMessage}
                  </div>
                )}
                {file && (
                  <div className="flex flex-column gap-3">
                    {file.map((fileName: any, index: number) => (
                      <div
                        key={index}
                        className="flex align-items-center gap-3"
                      >
                        <a className="m-0 flex align-items-center gap-2 underline text-charcoal">
                          <img src={pdfIcon} alt="PDF" />
                          <span>{fileName.name}</span>
                        </a>
                        <Button
                          text
                          className="p-button-plain gap-2 text-delete underline"
                          onClick={() => handleDelete(index)}
                          aria-label={t("record.delete")}
                        >
                          <FeatherIcon
                            name="trash-2"
                            size={20}
                            onClick={undefined}
                          />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-white w-full mb-5 shadow-md">
          <div className="bg-white hidden md:flex align-items-center px-5 py-3 gap-4 fixed-footer w-full left-0 shadow">
            <Button
              type="button"
              label={t("record.cancel")}
              className="button-md"
              severity="secondary"
              onClick={() => {
                handleCancel();
              }}
            />
            <Button
              type="button"
              onClick={() => {
                setSaveAsDraftClicked(true);
              }}
              text
              className="p-button-plain underline ml-auto"
              label={t("record.saveasdraft")}
              disabled={!showDraft}
            ></Button>
            <Button
              type="button"
              className="button-md gap-1"
              severity="secondary"
              disabled={!showDraft}
              onClick={() => {
                navigate(
                  currentType
                    ? "/record/create?type=" + currentType
                    : "/record/create"
                );
              }}
            >
              <FeatherIcon name="chevron-left" size={20} color="inherit" />
              <span className="font-bold text-capitalize">
                {t("record.back")}
              </span>
            </Button>
            <Button
              onClick={() => {
                setSaveAsDraftClicked(false);
              }}
              label={t("record.preview")}
              className="button-md"
            />
          </div>

          {/* Mobile responsive buttions */}
          <div className="bg-white md:hidden flex flex-wrap align-items-center px-5 py-3 gap-3 fixed-footer w-full left-0 shadow">
            <Button
              onClick={() => {
                setSaveAsDraftClicked(false);
              }}
              label={t("record.preview")}
              className="button-md w-full"
            />
            <div className="flex align-items-center gap-3 w-full">
              <Button
                className="button-md"
                severity="secondary"
                onClick={() => {
                  navigate("/record/create");
                }}
                aria-label={t("record.back")}
              >
                <FeatherIcon name="chevron-left" size={20} color="inherit" />
              </Button>
              <Button
                label={t("record.cancel")}
                className="button-md w-full"
                severity="secondary"
                onClick={handleCancel}
              />
            </div>
            <Button
              onClick={() => {
                setSaveAsDraftClicked(true);
              }}
              text
              className="p-button-plain underline w-full"
              label={t("record.saveasdraft")}
            ></Button>
          </div>
        </div>
      </form>
    </>
  );
};
export default RecordDetails;
