package com.hrms.performance.service;

import com.hrms.common.exception.ForbiddenException;
import com.hrms.common.exception.NotFoundException;
import com.hrms.common.security.UserPrincipal;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.repository.EmployeeRepository;
import com.hrms.performance.dto.GoalRequest;
import com.hrms.performance.dto.GoalResponse;
import com.hrms.performance.dto.PerformanceReviewRequest;
import com.hrms.performance.dto.PerformanceReviewResponse;
import com.hrms.performance.entity.Goal;
import com.hrms.performance.entity.GoalStatus;
import com.hrms.performance.entity.PerformanceReview;
import com.hrms.performance.repository.GoalRepository;
import com.hrms.performance.repository.PerformanceReviewRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PerformanceService {

    private final GoalRepository goalRepository;
    private final PerformanceReviewRepository reviewRepository;
    private final EmployeeRepository employeeRepository;

    
    public PerformanceService(
            GoalRepository goalRepository,
            PerformanceReviewRepository reviewRepository,
            EmployeeRepository employeeRepository) {
        this.goalRepository = goalRepository;
        this.reviewRepository = reviewRepository;
        this.employeeRepository = employeeRepository;
    }

    
    
    

    private UserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ForbiddenException("User not authenticated");
        }
        return (UserPrincipal) authentication.getPrincipal();
    }

    private Long getCurrentEmployeeId() {
        UserPrincipal user = getCurrentUser();
        return employeeRepository.findByUserId(user.getId())
                .map(Employee::getId)
                .orElseThrow(() -> new ForbiddenException("Employee profile not found"));
    }

    private String getCurrentUserRole() {
        UserPrincipal user = getCurrentUser();
        return user.getAuthorities().stream()
                .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                .findFirst()
                .orElse("");
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found with id: " + id));
    }

    private boolean isEmployeeInManagerTeam(Long employeeId, Long managerId) {
        Employee employee = findEmployee(employeeId);
        return employee.getManagerId() != null && employee.getManagerId().equals(managerId);
    }

    
    
    

            public GoalResponse createGoal(GoalRequest request) {
        String role = getCurrentUserRole();
        Long currentEmployeeId = getCurrentEmployeeId();

        
        if ("EMPLOYEE".equals(role)) {
            throw new ForbiddenException("Employees cannot create goals");
        }

        Employee employee = findEmployee(request.getEmployeeId()); 
        Employee manager = findEmployee(request.getManagerId());   

        
        if ("MANAGER".equals(role)) {
            if (!isEmployeeInManagerTeam(request.getEmployeeId(), currentEmployeeId)) {
                throw new ForbiddenException("You can only create goals for employees in your team");
            }
        }

        Goal goal = new Goal();
        goal.setTitle(request.getTitle());             
        goal.setDescription(request.getDescription()); 
        goal.setTarget(request.getTarget());           
        goal.setDueDate(request.getDueDate());         
        goal.setPriority(request.getPriority());       
        goal.setStatus(request.getStatus());           
        goal.setEmployee(employee);
        goal.setManager(manager);
        
        return toResponse(goalRepository.save(goal));
    }

    @Transactional(readOnly = true)
public List<GoalResponse> goals() {
    String role = getCurrentUserRole();
    Long currentEmployeeId = getCurrentEmployeeId();

    if ("HR".equals(role)) {
        
        return goalRepository.findAll().stream()
                .filter(goal -> goal.getEmployee() != null && goal.getManager() != null) 
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    if ("MANAGER".equals(role)) {
        
        return goalRepository.findAll().stream()
                .filter(goal -> {
                    
                    if (goal.getEmployee() == null || goal.getManager() == null) {
                        return false; 
                    }
                    
                    Long employeeId = goal.getEmployee().getId();
                    Long managerId = goal.getManager().getId();
                    
                    
                    return managerId.equals(currentEmployeeId) || 
                           employeeId.equals(currentEmployeeId) ||
                           isEmployeeInManagerTeam(employeeId, currentEmployeeId);
                })
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    if ("EMPLOYEE".equals(role)) {
        
        return goalRepository.findByEmployeeId(currentEmployeeId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    return List.of();
}

    public GoalResponse updateGoalStatus(Long goalId, String status) {
        String role = getCurrentUserRole();
        Long currentEmployeeId = getCurrentEmployeeId();

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new NotFoundException("Goal not found with id: " + goalId));

        
        if ("EMPLOYEE".equals(role)) {
            if (!goal.getEmployee().getId().equals(currentEmployeeId)) {
                throw new ForbiddenException("You can only update your own goals");
            }
        }

        if ("MANAGER".equals(role)) {
            Long employeeId = goal.getEmployee().getId();
            if (!isEmployeeInManagerTeam(employeeId, currentEmployeeId) && 
                !goal.getManager().getId().equals(currentEmployeeId)) {
                throw new ForbiddenException("You can only update goals for your team members");
            }
        }

        
        GoalStatus goalStatus;
        if ("OPEN".equalsIgnoreCase(status)) {
            goalStatus = GoalStatus.NOT_STARTED;
        } else {
            try {
                goalStatus = GoalStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid status: " + status);
            }
        }

        goal.setStatus(goalStatus);
        return toResponse(goalRepository.save(goal));
    }

    
    
    

        public PerformanceReviewResponse createReview(PerformanceReviewRequest request) {
        String role = getCurrentUserRole();
        Long currentEmployeeId = getCurrentEmployeeId();

        
        if ("EMPLOYEE".equals(role)) {
            throw new ForbiddenException("Employees cannot create performance reviews");
        }

        Employee employee = findEmployee(request.getEmployeeId()); 
        Employee manager = findEmployee(request.getManagerId());   

        
        if ("MANAGER".equals(role)) {
            if (!isEmployeeInManagerTeam(request.getEmployeeId(), currentEmployeeId)) {
                throw new ForbiddenException("You can only create reviews for employees in your team");
            }
        }

        PerformanceReview review = new PerformanceReview();
        review.setEmployee(employee);
        review.setManager(manager);
        review.setTechnicalSkills(request.getTechnicalSkills()); 
        review.setCommunication(request.getCommunication());     
        review.setTeamwork(request.getTeamwork());               
        review.setLeadership(request.getLeadership());           
        review.setProblemSolving(request.getProblemSolving());   
        review.setOverallRating(request.getOverallRating());     
        review.setFeedback(request.getFeedback());               
        review.setReviewDate(request.getReviewDate());           
        
        return toResponse(reviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public List<PerformanceReviewResponse> reviews() {
        String role = getCurrentUserRole();
        Long currentEmployeeId = getCurrentEmployeeId();

        if ("HR".equals(role)) {
            
            return reviewRepository.findAll().stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        if ("MANAGER".equals(role)) {
            
            return reviewRepository.findAll().stream()
                    .filter(review -> {
                        Long employeeId = review.getEmployee().getId();
                        Long managerId = review.getManager().getId();
                        return managerId.equals(currentEmployeeId) || 
                               employeeId.equals(currentEmployeeId) ||
                               isEmployeeInManagerTeam(employeeId, currentEmployeeId);
                    })
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        if ("EMPLOYEE".equals(role)) {
            
            return reviewRepository.findByEmployeeId(currentEmployeeId).stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        return List.of();
    }

    
    
    

    public GoalResponse getGoal(Long goalId) {
        String role = getCurrentUserRole();
        Long currentEmployeeId = getCurrentEmployeeId();

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new NotFoundException("Goal not found with id: " + goalId));

        
        if ("EMPLOYEE".equals(role)) {
            if (!goal.getEmployee().getId().equals(currentEmployeeId)) {
                throw new ForbiddenException("You can only view your own goals");
            }
        }

        if ("MANAGER".equals(role)) {
            Long employeeId = goal.getEmployee().getId();
            if (!isEmployeeInManagerTeam(employeeId, currentEmployeeId) && 
                !goal.getManager().getId().equals(currentEmployeeId)) {
                throw new ForbiddenException("You can only view goals for your team members");
            }
        }

        return toResponse(goal);
    }

    public PerformanceReviewResponse getReview(Long reviewId) {
        String role = getCurrentUserRole();
        Long currentEmployeeId = getCurrentEmployeeId();

        PerformanceReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found with id: " + reviewId));

        
        if ("EMPLOYEE".equals(role)) {
            if (!review.getEmployee().getId().equals(currentEmployeeId)) {
                throw new ForbiddenException("You can only view your own reviews");
            }
        }

        if ("MANAGER".equals(role)) {
            Long employeeId = review.getEmployee().getId();
            if (!isEmployeeInManagerTeam(employeeId, currentEmployeeId) && 
                !review.getManager().getId().equals(currentEmployeeId)) {
                throw new ForbiddenException("You can only view reviews for your team members");
            }
        }

        return toResponse(review);
    }

    
    
    

    private GoalResponse toResponse(Goal goal) {
        String employeeName = goal.getEmployee().getFirstName() + " " + goal.getEmployee().getLastName();
        String managerName = goal.getManager().getFirstName() + " " + goal.getManager().getLastName();
        
        return new GoalResponse(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getTarget(),
                goal.getDueDate(),
                goal.getPriority(),
                goal.getStatus(),
                goal.getEmployee().getId(),
                employeeName,
                goal.getManager().getId(),
                managerName,
                goal.getCreatedAt(),
                goal.getUpdatedAt()
        );
    }

    private PerformanceReviewResponse toResponse(PerformanceReview review) {
        String employeeName = review.getEmployee().getFirstName() + " " + review.getEmployee().getLastName();
        String managerName = review.getManager().getFirstName() + " " + review.getManager().getLastName();
        
        return new PerformanceReviewResponse(
                review.getId(),
                review.getEmployee().getId(),
                employeeName,
                review.getManager().getId(),
                managerName,
                review.getTechnicalSkills(),
                review.getCommunication(),
                review.getTeamwork(),
                review.getLeadership(),
                review.getProblemSolving(),
                review.getOverallRating(),
                review.getFeedback(),
                review.getReviewDate(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
    



    public GoalResponse updateGoal(Long goalId, GoalRequest request) {
        String role = getCurrentUserRole();
        Long currentEmployeeId = getCurrentEmployeeId();

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new NotFoundException("Goal not found with id: " + goalId));

        
        if ("EMPLOYEE".equals(role)) {
            throw new ForbiddenException("Employees cannot update goals");
        }

        if ("MANAGER".equals(role)) {
            Long employeeId = goal.getEmployee().getId();
            if (!isEmployeeInManagerTeam(employeeId, currentEmployeeId) && 
                !goal.getManager().getId().equals(currentEmployeeId)) {
                throw new ForbiddenException("You can only update goals for your team members");
            }
        }

        
        goal.setTitle(request.getTitle());             
        goal.setDescription(request.getDescription()); 
        goal.setTarget(request.getTarget());           
        goal.setDueDate(request.getDueDate());         
        goal.setPriority(request.getPriority());       
        goal.setStatus(request.getStatus());           
        
        
        if (request.getEmployeeId() != null && !request.getEmployeeId().equals(goal.getEmployee().getId())) {
            goal.setEmployee(findEmployee(request.getEmployeeId()));
        }
        if (request.getManagerId() != null && !request.getManagerId().equals(goal.getManager().getId())) {
            goal.setManager(findEmployee(request.getManagerId()));
        }
        
        return toResponse(goalRepository.save(goal));
    }

public void deleteGoal(Long goalId) {
    String role = getCurrentUserRole();
    
    
    if ("EMPLOYEE".equals(role)) {
        throw new ForbiddenException("Employees cannot delete goals");
    }
    
    Goal goal = goalRepository.findById(goalId)
            .orElseThrow(() -> new NotFoundException("Goal not found with id: " + goalId));
    
    if ("MANAGER".equals(role)) {
        Long currentEmployeeId = getCurrentEmployeeId();
        Long employeeId = goal.getEmployee().getId();
        if (!isEmployeeInManagerTeam(employeeId, currentEmployeeId)) {
            throw new ForbiddenException("You can only delete goals for your team members");
        }
    }
    
    goalRepository.deleteById(goalId);
}

public PerformanceReviewResponse updateReview(Long reviewId, PerformanceReviewRequest request) {
    String role = getCurrentUserRole();
    Long currentEmployeeId = getCurrentEmployeeId();

    
    if ("EMPLOYEE".equals(role)) {
        throw new ForbiddenException("Employees cannot update performance reviews");
    }

    PerformanceReview review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new NotFoundException("Review not found with id: " + reviewId));

    
    if ("MANAGER".equals(role)) {
        Long employeeId = review.getEmployee().getId();
        if (!isEmployeeInManagerTeam(employeeId, currentEmployeeId)) {
            throw new ForbiddenException("You can only update reviews for employees in your team");
        }
    }

    
     review.setTechnicalSkills(request.getTechnicalSkills());
        review.setCommunication(request.getCommunication());
        review.setTeamwork(request.getTeamwork());
        review.setLeadership(request.getLeadership());
        review.setProblemSolving(request.getProblemSolving());
        review.setOverallRating(request.getOverallRating());
        review.setFeedback(request.getFeedback());
        review.setReviewDate(request.getReviewDate());
    
    
    if (request.getEmployeeId() != null && !request.getEmployeeId().equals(review.getEmployee().getId())) {
            review.setEmployee(findEmployee(request.getEmployeeId()));
        }
        if (request.getManagerId() != null && !request.getManagerId().equals(review.getManager().getId())) {
            review.setManager(findEmployee(request.getManagerId()));
        }
        
    
    return toResponse(reviewRepository.save(review));
}

public void deleteReview(Long reviewId) {
    String role = getCurrentUserRole();
    
    
    if (!"HR".equals(role)) {
        throw new ForbiddenException("Only HR can delete performance reviews");
    }
    
    PerformanceReview review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new NotFoundException("Review not found with id: " + reviewId));
    
    reviewRepository.deleteById(reviewId);
}

@Transactional(readOnly = true)
public Object getEmployeePerformanceSummary(Long employeeId) {
    String role = getCurrentUserRole();
    Long currentEmployeeId = getCurrentEmployeeId();

    
    if ("EMPLOYEE".equals(role)) {
        if (!employeeId.equals(currentEmployeeId)) {
            throw new ForbiddenException("You can only view your own performance summary");
        }
    }

    if ("MANAGER".equals(role)) {
        if (!isEmployeeInManagerTeam(employeeId, currentEmployeeId)) {
            throw new ForbiddenException("You can only view performance summaries for your team members");
        }
    }

    
    Employee employee = findEmployee(employeeId);
    
    
    List<Goal> employeeGoals = goalRepository.findByEmployee(employee);
    List<PerformanceReview> employeeReviews = reviewRepository.findByEmployee(employee);
    
    
    long totalGoals = employeeGoals.size();
    long completedGoals = employeeGoals.stream()
            .filter(g -> g.getStatus() == GoalStatus.COMPLETED)
            .count();
    
    double averageRating = employeeReviews.stream()
            .mapToDouble(r -> r.getOverallRating() != null ? r.getOverallRating() : 0.0)
            .average()
            .orElse(0.0);
    
    return java.util.Map.of(
        "employeeId", employeeId,
        "employeeName", employee.getFirstName() + " " + employee.getLastName(),
        "totalGoals", totalGoals,
        "completedGoals", completedGoals,
        "completionRate", totalGoals > 0 ? (double) completedGoals / totalGoals * 100 : 0.0,
        "totalReviews", employeeReviews.size(),
        "averageRating", Math.round(averageRating * 10.0) / 10.0,
        "goals", employeeGoals.stream().map(this::toResponse).collect(Collectors.toList()),
        "reviews", employeeReviews.stream().map(this::toResponse).collect(Collectors.toList())
    );
}
}