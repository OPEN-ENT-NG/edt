import { Behaviours, moment } from "entcore";
import { Mix } from "entcore-toolkit";
import { Exclusion } from "../model";
import { CalendarItems } from "../model/calendarItems";

export const SETTINGS_SNIPPLET = {
  hidden: true,
  controller: {
    init: async function () {
      this.display = {
        exclusionForm: false,
        DropLightbox: false,
      };
      this.periodCourses;
      this.current = { exclusion: null };
      this.sort = {
        type: "start_date",
        reverse: false,
      };
      this.exclusions =
        new Behaviours.applicationsBehaviours.edt.model.Exclusions();
      this.$watch(
        () => this.structure,
        async () => {
          if (this.structure !== undefined) {
            await this.exclusions.sync(this.structure.id);
            this.$apply();
          }
        }
      );
    },

    addExclusion: async function () {
      this.openExclusionForm(
        new Behaviours.applicationsBehaviours.edt.model.Exclusion(
          this.structure.id
        )
      );
      this.periodCourses = new CalendarItems();
      await this.periodCourses.syncOccurrences(
        this.structure.id,
        this.current.exclusion.start_date,
        this.current.exclusion.end_date
      );
    },

    openExclusionForm: function (exclusion: Exclusion) {
      this.current.exclusion = exclusion;
      if (exclusion.id) {
        this.current.tmpExclusion = new Exclusion();
        this.current.tmpExclusion = Mix.castAs(Exclusion, exclusion);
      }
      this.display.exclusionForm = true;
    },

    cancelExclusionForm: function () {
      if (this.current.tmpExclusion) {
        for (let key in this.current.tmpExclusion) {
          this.current.exclusion[key] = this.current.tmpExclusion[key];
        }
        delete this.current.tmpExclusion;
      }
      this.display.exclusionForm = false;
    },

    createExclusion: async function () {
      this.current.exclusion.loading = true;
      await this.current.exclusion.save();
      this.display.exclusionForm = false;
      this.current.exclusion.loading = false;
      this.$apply();
      await this.exclusions.sync(this.structure.id);
      this.$apply();
    },

    verifyCoursesInDatabase: async function () {
      this.periodCourses = new CalendarItems();
      await this.periodCourses.syncOccurrences(
        this.structure.id,
        this.current.exclusion.start_date,
        this.current.exclusion.end_date
      );
      this.$apply();
      return this.periodCourses.all.length;
    },

    coursePeriode: async function () {
      let courses = new CalendarItems();
      await courses.syncOccurrences(
        this.structure.id,
        this.current.exclusion.start_date,
        this.current.exclusion.end_date
      );
      return courses.all;
    },

    validDeletion: async function (ex: Exclusion) {
      await ex.delete();
      this.display.DropLightbox = false;
      await this.exclusions.sync(this.structure.id);
      this.$apply();
    },

    cancelDeletion: function () {
      this.display.DropLightbox = false;
      delete this.current.exclusion;
    },

    dropExclusion: function (ex: Exclusion) {
      this.current.exclusion = ex;
      this.display.DropLightbox = true;
    },

    formatDate: function (date: any) {
      return moment(date).format("DD/MM/YYYY");
    },

    currentExclusionValidation: function () {
      if (this.current.exclusion) {
        return (
          this.current.exclusion.description.trim() !== "" &&
          moment(this.current.exclusion.end_date).diff(
            moment(this.current.exclusion.start_date)
          ) >= 0 &&
          moment().isBefore(this.current.exclusion.start_date)
        );
      }
    },

    updateExclusion: function (exclusion) {
      exclusion.save().then(() => {
        exclusion.loading = false;
        this.$apply();
      });
      exclusion.loading = true;
      this.$apply();
    },
  },
};
