import { AxiosError, AxiosResponse } from "axios";
import { toasts } from "entcore";
import { CourseTag } from "../model/courseTag";
import { courseTagService } from "../services";

declare let window: any;
let that;

interface IViewModel {
  courseTagForm: CourseTag;
  courseEditTagForm: CourseTag;
  courseTags: Array<CourseTag>;

  editCourseTagLightbox: boolean;

  getCourseTags(): Promise<void>;

  createCourseTag(): Promise<void>;

  deleteCourseTag(courseTagId: number): Promise<void>;

  updateCourseTag(): Promise<void>;

  openCourseTagLightbox(tag: CourseTag): void;

  closeCourseTagLightbox(): void;

  toggleVisibility(courseTag: CourseTag): void;

  isFormValid(): boolean;

  isEditFormValid(): boolean;
}

const vm: IViewModel = {
  courseTagForm: {
    label: "",
    abbreviation: "",
    isPrimary: false,
    allowRegister: true,
  },
  courseTags: [],

  courseEditTagForm: {
    id: null,
    label: "",
    abbreviation: "",
    isPrimary: false,
    allowRegister: true,
  },

  editCourseTagLightbox: false,

  getCourseTags: async (): Promise<void> => {
    vm.courseTags = await courseTagService.getCourseTags(
      window.model.vieScolaire.structure.id
    );
    that.safeApply();
  },

  createCourseTag: async (): Promise<void> => {
    courseTagService
      .createCourseTag(window.model.vieScolaire.structure.id, vm.courseTagForm)
      .then((res: AxiosResponse): void => {
        if (res.status === 200 || res.status === 201) {
          vm.courseTagForm = {
            isPrimary: false,
            allowRegister: true,
            label: null,
            abbreviation: null,
          };
          toasts.confirm("edt.admin.course.tags.form.create.success");
          vm.getCourseTags();
        } else {
          toasts.warning("edt.admin.course.tags.form.create.error");
        }
      })
      .catch((_: AxiosError): void =>
        toasts.warning("edt.admin.course.tags.form.create.error")
      );
  },

  deleteCourseTag: async (courseTagId: number): Promise<void> => {
    courseTagService
      .deleteCourseTag(window.model.vieScolaire.structure.id, courseTagId)
      .then((res: AxiosResponse): void => {
        if (res.status === 200 || res.status === 201) {
          vm.courseTagForm = null;
          toasts.confirm("edt.admin.course.tags.form.delete.success");
          vm.getCourseTags();
        } else {
          toasts.warning("edt.admin.course.tags.form.delete.error");
        }
      })
      .catch((_: AxiosError): void =>
        toasts.warning("edt.admin.course.tags.form.delete.error")
      );
  },

  updateCourseTag: async (): Promise<void> => {
    courseTagService
      .updateCourseTag(vm.courseEditTagForm)
      .then((res: AxiosResponse): void => {
        if (res.status === 200 || res.status === 201) {
          vm.closeCourseTagLightbox();
          toasts.confirm("edt.admin.course.tags.form.edit.success");
          vm.getCourseTags();
        } else {
          toasts.warning("edt.admin.course.tags.form.edit.error");
        }
      })
      .catch((_: AxiosError): void =>
        toasts.warning("edt.admin.course.tags.form.edit.error")
      );
  },

  openCourseTagLightbox: (tag: CourseTag): void => {
    vm.editCourseTagLightbox = true;
    vm.courseEditTagForm = {
      id: tag.id,
      label: tag.label,
      abbreviation: tag.abbreviation,
      isPrimary: tag.isPrimary,
      allowRegister: tag.allowRegister,
    };
  },
  closeCourseTagLightbox: (): void => {
    vm.courseEditTagForm = null;
    vm.editCourseTagLightbox = false;
  },

  toggleVisibility: async (courseTag: CourseTag): Promise<void> => {
    await courseTagService.updateCourseTagHidden(
      window.model.vieScolaire.structure.id,
      courseTag.id,
      !courseTag.isHidden
    );
    vm.getCourseTags();
  },

  isFormValid: (): boolean => {
    return (
      vm.courseTagForm.label !== null &&
      vm.courseTagForm.label.length > 0 &&
      vm.courseTagForm.abbreviation !== null &&
      vm.courseTagForm.abbreviation.length > 0 &&
      vm.courseTagForm.isPrimary != null &&
      vm.courseTagForm.allowRegister != null
    );
  },

  isEditFormValid: (): boolean => {
    return (
      vm.courseEditTagForm.label !== null &&
      vm.courseEditTagForm.label.length > 0 &&
      vm.courseEditTagForm.abbreviation !== null &&
      vm.courseEditTagForm.abbreviation.length > 0 &&
      vm.courseEditTagForm.isPrimary != null &&
      vm.courseEditTagForm.allowRegister != null
    );
  },
};

export const courseTags = {
  title: "Labels de cours",
  description: "Interface to manage course labels",
  controller: {
    init: async function () {
      that = this;
      this.vm = vm;
      this.setHandler();
      await vm.getCourseTags();
      that.safeApply();
    },
    setHandler: function () {
      this.$watch(
        () => window.model.vieScolaire.structure,
        async () => {
          vm.getCourseTags();
        }
      );
    },
    safeApply: function (): Promise<any> {
      return new Promise((resolve, reject) => {
        let phase = this.$root.$$phase;
        if (phase === "$apply" || phase === "$digest") {
          if (resolve && typeof resolve === "function") {
            resolve();
          }
        } else {
          if (resolve && typeof resolve === "function") {
            this.$apply(resolve);
          } else {
            this.safeApply();
          }
        }
      });
    },
  },
};
