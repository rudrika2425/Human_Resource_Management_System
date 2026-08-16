package com.hrms.performance.entity;

import com.hrms.common.entity.AuditableEntity;
import com.hrms.employee.entity.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "performance_reviews")
public class PerformanceReview extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "manager_id", nullable = false)
    private Employee manager;

    @Column(nullable = false)
    private Integer technicalSkills;

    @Column(nullable = false)
    private Integer communication;

    @Column(nullable = false)
    private Integer teamwork;

    @Column(nullable = false)
    private Integer leadership;

    @Column(nullable = false)
    private Integer problemSolving;

    @Column(nullable = false)
    private Integer overallRating;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(nullable = false)
    private LocalDate reviewDate;

    // Default constructor
    public PerformanceReview() {
    }

    // Constructor with all fields
    public PerformanceReview(Employee employee, Employee manager, Integer technicalSkills,
                             Integer communication, Integer teamwork, Integer leadership,
                             Integer problemSolving, Integer overallRating,
                             String feedback, LocalDate reviewDate) {
        this.employee = employee;
        this.manager = manager;
        this.technicalSkills = technicalSkills;
        this.communication = communication;
        this.teamwork = teamwork;
        this.leadership = leadership;
        this.problemSolving = problemSolving;
        this.overallRating = overallRating;
        this.feedback = feedback;
        this.reviewDate = reviewDate;
    }

    // Getters
    public Employee getEmployee() {
        return employee;
    }

    public Employee getManager() {
        return manager;
    }

    public Integer getTechnicalSkills() {
        return technicalSkills;
    }

    public Integer getCommunication() {
        return communication;
    }

    public Integer getTeamwork() {
        return teamwork;
    }

    public Integer getLeadership() {
        return leadership;
    }

    public Integer getProblemSolving() {
        return problemSolving;
    }

    public Integer getOverallRating() {
        return overallRating;
    }

    public String getFeedback() {
        return feedback;
    }

    public LocalDate getReviewDate() {
        return reviewDate;
    }

    // Setters
    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public void setManager(Employee manager) {
        this.manager = manager;
    }

    public void setTechnicalSkills(Integer technicalSkills) {
        this.technicalSkills = technicalSkills;
    }

    public void setCommunication(Integer communication) {
        this.communication = communication;
    }

    public void setTeamwork(Integer teamwork) {
        this.teamwork = teamwork;
    }

    public void setLeadership(Integer leadership) {
        this.leadership = leadership;
    }

    public void setProblemSolving(Integer problemSolving) {
        this.problemSolving = problemSolving;
    }

    public void setOverallRating(Integer overallRating) {
        this.overallRating = overallRating;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public void setReviewDate(LocalDate reviewDate) {
        this.reviewDate = reviewDate;
    }

    // Builder pattern
    public static PerformanceReviewBuilder builder() {
        return new PerformanceReviewBuilder();
    }

    public static class PerformanceReviewBuilder {
        private Employee employee;
        private Employee manager;
        private Integer technicalSkills;
        private Integer communication;
        private Integer teamwork;
        private Integer leadership;
        private Integer problemSolving;
        private Integer overallRating;
        private String feedback;
        private LocalDate reviewDate;

        public PerformanceReviewBuilder employee(Employee employee) {
            this.employee = employee;
            return this;
        }

        public PerformanceReviewBuilder manager(Employee manager) {
            this.manager = manager;
            return this;
        }

        public PerformanceReviewBuilder technicalSkills(Integer technicalSkills) {
            this.technicalSkills = technicalSkills;
            return this;
        }

        public PerformanceReviewBuilder communication(Integer communication) {
            this.communication = communication;
            return this;
        }

        public PerformanceReviewBuilder teamwork(Integer teamwork) {
            this.teamwork = teamwork;
            return this;
        }

        public PerformanceReviewBuilder leadership(Integer leadership) {
            this.leadership = leadership;
            return this;
        }

        public PerformanceReviewBuilder problemSolving(Integer problemSolving) {
            this.problemSolving = problemSolving;
            return this;
        }

        public PerformanceReviewBuilder overallRating(Integer overallRating) {
            this.overallRating = overallRating;
            return this;
        }

        public PerformanceReviewBuilder feedback(String feedback) {
            this.feedback = feedback;
            return this;
        }

        public PerformanceReviewBuilder reviewDate(LocalDate reviewDate) {
            this.reviewDate = reviewDate;
            return this;
        }

        public PerformanceReview build() {
            return new PerformanceReview(employee, manager, technicalSkills, communication,
                    teamwork, leadership, problemSolving, overallRating, feedback, reviewDate);
        }
    }

    // Business methods
    public double calculateAverageRating() {
        int total = technicalSkills + communication + teamwork + leadership + problemSolving;
        return total / 5.0;
    }

    public boolean isExcellent() {
        return overallRating >= 9;
    }

    public boolean isGood() {
        return overallRating >= 7 && overallRating < 9;
    }

    public boolean isSatisfactory() {
        return overallRating >= 5 && overallRating < 7;
    }

    public boolean isNeedsImprovement() {
        return overallRating < 5;
    }

    public String getPerformanceLevel() {
        if (isExcellent()) return "EXCELLENT";
        if (isGood()) return "GOOD";
        if (isSatisfactory()) return "SATISFACTORY";
        return "NEEDS_IMPROVEMENT";
    }

    public boolean allRatingsValid() {
        return isValidRating(technicalSkills) && isValidRating(communication) &&
               isValidRating(teamwork) && isValidRating(leadership) &&
               isValidRating(problemSolving) && isValidRating(overallRating);
    }

    private boolean isValidRating(Integer rating) {
        return rating != null && rating >= 1 && rating <= 10;
    }

    public boolean hasHighScoreInAllCategories() {
        return technicalSkills >= 8 && communication >= 8 && teamwork >= 8 &&
               leadership >= 8 && problemSolving >= 8;
    }

    public Integer getHighestScore() {
        return Math.max(Math.max(Math.max(Math.max(technicalSkills, communication),
                teamwork), leadership), problemSolving);
    }

    public Integer getLowestScore() {
        return Math.min(Math.min(Math.min(Math.min(technicalSkills, communication),
                teamwork), leadership), problemSolving);
    }

    public boolean isReviewedByManager(Long managerId) {
        return manager != null && manager.getId() != null && manager.getId().equals(managerId);
    }

    public boolean isForEmployee(Long employeeId) {
        return employee != null && employee.getId() != null && employee.getId().equals(employeeId);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PerformanceReview that = (PerformanceReview) o;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "PerformanceReview{" +
                "id=" + getId() +
                ", employeeId=" + (employee != null ? employee.getId() : null) +
                ", managerId=" + (manager != null ? manager.getId() : null) +
                ", technicalSkills=" + technicalSkills +
                ", communication=" + communication +
                ", teamwork=" + teamwork +
                ", leadership=" + leadership +
                ", problemSolving=" + problemSolving +
                ", overallRating=" + overallRating +
                ", averageRating=" + calculateAverageRating() +
                ", performanceLevel='" + getPerformanceLevel() + '\'' +
                ", reviewDate=" + reviewDate +
                '}';
    }
}